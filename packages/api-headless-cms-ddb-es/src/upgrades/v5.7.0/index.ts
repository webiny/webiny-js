import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { CmsContentEntry, CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import configurations from "../../configurations";
import { TYPE_ENTRY_LATEST } from "../../operations/entry/CmsContentEntryDynamoElastic";
import WebinyError from "@webiny/error";
import lodashChunk from "lodash.chunk";
import definitions from "../../definitions";

interface EntryRecordData {
    /**
     * A generated mdbid with the version number.
     */
    id: string;
    /**
     * A generated mdbid without the version number.
     */
    entryId: string;
    /**
     * Tenant id.
     */
    tenant: string;
    /**
     * Locale code.
     */
    locale: string;
}

const sleep = async (ms = 2000): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, ms));
};
/**
 * Entry ID is the first part of the ID, before the #.
 */
const extractEntryId = (id: string): string => {
    if (id.includes("#") === false) {
        throw new WebinyError(
            "Missing # in the given id value. Possibly not an ID.",
            "MALFORMED_ID_ERROR",
            {
                id
            }
        );
    }
    const entryId = id.split("#").shift();
    if (!entryId) {
        throw new WebinyError("Malformed entry ID.", "MALFORMED_ID_ERROR", {
            id
        });
    }
    return entryId;
};

const createPartitionKey = (data: EntryRecordData) => {
    const entryId = extractEntryId(data.id);
    if (!data.tenant) {
        throw new WebinyError("Missing tenant on entry record data.", "TENANT_ERROR", {
            data
        });
    } else if (!data.locale) {
        throw new WebinyError("Missing locale on entry record data.", "LOCALE_ERROR", {
            data
        });
    }
    return `T#${data.tenant}#L#${data.locale}#CMS#CME#${entryId}`;
};
/**
 * DynamoDB Toolbox Entity query executor.
 * This helps with paginating the result and loading all of the data that can be fetched by the query.
 */
const executeQuery = async <T>(query: Promise<any>): Promise<T[]> => {
    const items: T[] = [];
    /**
     * First result is actually the real query result.
     */
    let previousResult = await query;
    if (
        !previousResult ||
        Array.isArray(previousResult.Items) === false ||
        previousResult.Items.length === 0
    ) {
        return items;
    }
    items.push(...previousResult.Items);
    let result;
    /**
     * If previousResult.next method returns false it means there is nothing more to load.
     * Otherwise a result object is returned and we loop it.
     * This works only if autoParse is not false (it is true by default).
     */
    while ((result = previousResult.next())) {
        if (!result || Array.isArray(result.Items) === false || result.Items.length === 0) {
            return items;
        }
        items.push(...result.Items);
        previousResult = result;
    }
    return items;
};

export default (): UpgradePlugin<CmsContext> => ({
    type: "api-upgrade",
    name: "api-upgrade-5.7.0",
    app: "headless-cms",
    version: "5.7.0",
    async apply(context: CmsContext): Promise<void> {
        const { i18n, elasticSearch } = context;
        console.log("Started with the update of CMS entries.");

        /**
         * Define tables and entities via helper methods because tables and entities are created in multiple places in the code.
         */
        const table = definitions.defineTable(context);
        const elasticTable = definitions.defineElasticsearchTable(context);
        const modelEntity = definitions.defineModel(table);
        const entryEntity = definitions.defineEntry(table);
        const entryElasticsearchEntity = definitions.defineEntry(elasticTable);

        const entryRecords: Record<string, EntryRecordData> = {};
        const esIndices: { esIndex: string; localeCode: string }[] = [];
        const locales = i18n.getLocales();

        /**
         * We need to find all the entries in each of the possible elasticsearch indexes.
         * For that we need a list of indexes + localeCode.
         * To get the index name we need models from in each locale.
         */
        for (const locale of locales) {
            /**
             * Need all the models to build the elasticsearch indexes
             */
            const models = await executeQuery<CmsContentModel>(
                // TODO determine if required to loop through the tenants
                modelEntity.query(`T#root#L#${locale.code}#CMS#CM`)
            );

            for (const model of models) {
                const { index: esIndex } = configurations.es(
                    {
                        ...context,
                        cms: {
                            ...context.cms,
                            getLocale: () => {
                                return locale;
                            }
                        }
                    },
                    model
                );
                esIndices.push({
                    esIndex,
                    localeCode: locale.code
                });
            }
        }
        const limit = 100;
        /**
         * Get all the latest entries from all the indexes, we only need the ID of the entry from the Elasticsearch.
         * Other data we need is the tenant ID and locale code.
         */
        for (const esData of esIndices) {
            const { esIndex, localeCode } = esData;
            let hasMoreItems = true;
            let after: string;
            while (hasMoreItems) {
                const response = await elasticSearch.search({
                    index: esIndex,
                    body: {
                        query: {
                            bool: {
                                must: [
                                    {
                                        term: {
                                            __type: TYPE_ENTRY_LATEST
                                        }
                                    }
                                ]
                            }
                        },
                        sort: {
                            createdOn: {
                                order: "asc",
                                // eslint-disable-next-line
                                unmapped_type: "date"
                            }
                        },
                        size: limit + 1,
                        after
                    }
                });

                const { hits } = response.body.hits;

                for (const hit of hits) {
                    const entryId = extractEntryId(hit.id);
                    entryRecords[entryId] = {
                        id: hit.id,
                        entryId,
                        tenant: context.security.getTenant().id,
                        locale: localeCode
                    };
                }

                hasMoreItems = hits.length > limit;
                after = hasMoreItems ? hits[limit - 1].sort : undefined;
            }
        }
        console.log(
            `[ELASTICSEARCH] Retrieved ${
                Object.keys(entryRecords).length
            } entry IDs to query directly from the DynamoDB.`
        );
        /**
         * Now we go into the DynamoDB regular table and find all the entries with the given IDs.
         * This is done via the partition key as it is a combination of tenant, locale and generated entry id.
         * We need to have a query for each of the entries because there are possible versions, published and latest records.
         * We can use a scan but at that point all the records in the table would be read,
         * which is possibly expensive if there are a lot of records from the other applications (file manager, form builder, ...)
         */
        const regularQueries: Promise<CmsContentEntry[]>[] = [];
        for (const entryPartitionKey in entryRecords) {
            if (!entryRecords.hasOwnProperty(entryPartitionKey)) {
                continue;
            }
            const entryRecord = entryRecords[entryPartitionKey];
            const partitionKey = createPartitionKey(entryRecord);
            regularQueries.push(executeQuery<CmsContentEntry>(entryEntity.query(partitionKey)));
        }
        const regularEntries = (await Promise.all(regularQueries)).reduce((items, result) => {
            return items.concat(result);
        }, []);
        /**
         * Then we create updates to the regular DynamoDB records.
         */
        const updates = [];
        for (const entry of regularEntries) {
            const entryId = extractEntryId(entry.id);
            if (!entryRecords[entryId]) {
                continue;
            }
            const { tenant } = entryRecords[entryId];
            updates.push(
                entryEntity.putBatch({
                    ...entry,
                    entryId,
                    tenant
                })
            );
        }
        await table.batchWrite(updates);

        console.log(`[DYNAMODB] Table updated records: ${updates.length}`);
        /**
         * Time to go for the Elasticsearch data.
         * It is same as for the DynamoDB table data.
         */
        const elasticQueries = [];
        for (const entryPartitionKey in entryRecords) {
            if (!entryRecords.hasOwnProperty(entryPartitionKey)) {
                continue;
            }
            const entryRecord = entryRecords[entryPartitionKey];
            const partitionKey = createPartitionKey(entryRecord);
            elasticQueries.push(
                executeQuery<CmsContentEntry>(entryElasticsearchEntity.query(partitionKey))
            );
        }
        const elasticEntries = (await Promise.all(elasticQueries)).reduce((items, result) => {
            return items.concat(result);
        }, []);
        /**
         * Then we create the updates to the Elasticsearch records.
         */
        const elasticUpdates = [];
        for (const entry of elasticEntries) {
            const entryId = extractEntryId(entry.id);
            if (!entryRecords[entryId]) {
                continue;
            }
            const { tenant } = entryRecords[entryId];
            elasticUpdates.push(
                entryElasticsearchEntity.putBatch({
                    ...entry,
                    entryId,
                    tenant
                })
            );
        }

        const breakMs = 200;
        const recordsInABatch = 50;
        /**
         * Updating the Elasticsearch table is a bit tricky because it can break if overwhelmed.
         * We will take breakMs ms break between each recordsInABatch records
         */
        const elasticUpdatesChunks = lodashChunk(elasticUpdates, recordsInABatch);
        console.log(
            `[ELASTICSEARCH] Total chunks to be written with ${recordsInABatch} records in a batch: ${elasticUpdatesChunks.length}`
        );
        for (const elasticUpdateChunk of elasticUpdatesChunks) {
            await elasticTable.batchWrite(elasticUpdateChunk);
            await sleep(breakMs);
        }
        console.log(`[ELASTICSEARCH] Streaming table updated records: ${elasticUpdates.length}`);
    }
});
