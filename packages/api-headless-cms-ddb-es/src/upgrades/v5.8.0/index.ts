/**
 * File not used anymore.
 */
// @ts-nocheck
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { CmsEntry, CmsModel, CmsContext } from "@webiny/api-headless-cms/types";
import { configurations } from "~/configurations";
import { TYPE_ENTRY_LATEST } from "../../operations/entry/CmsContentEntryDynamoElastic";
import WebinyError from "@webiny/error";
import lodashChunk from "lodash/chunk";
import definitions from "../../definitions";
import { Entity } from "dynamodb-toolbox";
import { Client } from "@elastic/elasticsearch";

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

interface ElasticCmsContentEntry {
    index: string;
    PK: string;
    SK: string;
    data: CmsEntry;
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
    if (!data.id) {
        throw new WebinyError(
            `Missing ID in the EntryRecordData: ${JSON.stringify(data)}`,
            "RECORD_DATA_ID_ERROR",
            {
                data
            }
        );
    }
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
    while (typeof previousResult.next === "function" && (result = previousResult.next())) {
        if (!result || Array.isArray(result.Items) === false || result.Items.length === 0) {
            return items;
        }
        items.push(...result.Items);
        previousResult = result;
    }
    return items;
};

interface FetchEntriesArgs {
    records: Record<string, EntryRecordData>;
    entity: Entity<any>;
}

const fetchEntries = async <T>(args: FetchEntriesArgs): Promise<T[]> => {
    const { records, entity } = args;
    const queries = Object.values(records).map(record => {
        const partitionKey = createPartitionKey(record);
        return executeQuery<T>(entity.query(partitionKey));
    });
    try {
        const results = await Promise.all(queries);

        return results.reduce((items, result) => {
            return items.concat(result);
        }, []);
    } catch (ex) {
        throw new WebinyError(
            `Fetching the entries from "${entity.table.name}" table the error.`,
            "FETCH_ENTRIES_ERROR",
            {
                table: entity.table.name,
                entity: entity.name
            }
        );
    }
};

export default (): UpgradePlugin<CmsContext> => ({
    type: "api-upgrade",
    name: "api-upgrade-5.8.0",
    app: "headless-cms",
    version: "5.8.0",
    async apply(context: CmsContext): Promise<void> {
        const { i18n } = context;
        const elasticsearch: Client = (context as any).elasticsearch;
        if (!elasticsearch) {
            throw new WebinyError("Missing Elasticsearch client on the context.");
        }
        console.log("Started with the update of CMS entries.");

        /**
         * Define tables and entities via helper methods because tables and entities are created in multiple places in the code.
         */
        const table = definitions.defineTable(context);
        const elasticTable = definitions.defineElasticsearchTable(context);
        const modelEntity = definitions.defineModel({ context, table });
        const entryEntity = definitions.defineEntry({ context, table });
        const entryElasticsearchEntity = definitions.defineElasticsearchEntry({
            context,
            table: elasticTable
        });

        const entryRecords: Record<string, EntryRecordData> = {};
        const esIndices: { esIndex: string; localeCode: string }[] = [];
        const locales = i18n.getLocales();
        /**
         * max dynamodb limit
         */
        const recordsInABatch = 25;

        /**
         * We need to find all the entries in each of the possible elasticsearch indexes.
         * For that we need a list of indexes + localeCode.
         * To get the index name we need models from in each locale.
         */
        for (const locale of locales) {
            /**
             * Need all the models to build the elasticsearch indexes
             */
            const models = await executeQuery<CmsModel>(
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
                    // @ts-ignore
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
                const response = await elasticsearch.search({
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
                    /**
                     * _source should be an property on the hit, but we check it just in case something wrong happens.
                     * There are no Elasticsearch typings for this.
                     */
                    const source = hit._source || {};
                    if (!source.id) {
                        throw new WebinyError(
                            `Missing ID in source: ${JSON.stringify(source)}`,
                            "SOURCE_ID_ERROR",
                            {
                                source
                            }
                        );
                    }
                    const entryId = extractEntryId(source.id);
                    entryRecords[entryId] = {
                        id: source.id,
                        entryId,
                        tenant: context.tenancy.getCurrentTenant().id,
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
        const regularEntries = await fetchEntries<CmsEntry>({
            records: entryRecords,
            entity: entryEntity
        });

        /**
         * Then we create updates to the regular DynamoDB records.
         */
        const updates = [];
        for (const entry of regularEntries) {
            if (!entry.id) {
                throw new WebinyError(
                    `Missing ID in regular entry: ${JSON.stringify(entry)}`,
                    "ENTRY_ID_ERROR",
                    {
                        entry
                    }
                );
            }
            const entryId = extractEntryId(entry.id);
            if (!entryRecords[entryId]) {
                continue;
            }
            const { tenant } = entryRecords[entryId];
            /**
             * Remove the leftovers from the beta 5 to v5.0.0 upgrade
             */
            delete entry["ignore"];
            updates.push(
                entryEntity.putBatch({
                    ...entry,
                    entryId,
                    tenant
                })
            );
        }
        try {
            const chunks = lodashChunk(updates, recordsInABatch);
            for (const key in chunks) {
                if (!chunks.hasOwnProperty(key)) {
                    continue;
                }
                const chunk = chunks[key];
                await table.batchWrite(chunk);
            }
        } catch (ex) {
            throw new WebinyError(
                "Error while writing a batch of records to regular table.",
                "REGULAR_TABLE_WRITE_ERROR",
                {
                    length: updates.length,
                    ex
                }
            );
        }

        console.log(`[DYNAMODB] Table updated records: ${updates.length}`);
        /**
         * Time to go for the Elasticsearch data.
         */
        const elasticEntries = await fetchEntries<ElasticCmsContentEntry>({
            records: entryRecords,
            entity: entryElasticsearchEntity
        });
        /**
         * Then we create the updates to the Elasticsearch records.
         */
        const elasticUpdates = [];
        for (const entry of elasticEntries) {
            const data = entry.data;
            if (!data) {
                throw new WebinyError("Missing data in elastic entry.", "DATA_ERROR", {
                    entry
                });
            } else if (!data.id) {
                throw new WebinyError(
                    `Missing ID in elastic entry data: ${JSON.stringify(entry)}`,
                    "DATA_ID_ERROR",
                    {
                        entry
                    }
                );
            }
            const entryId = extractEntryId(data.id);
            if (!entryRecords[entryId]) {
                continue;
            }
            const { tenant } = entryRecords[entryId];
            /**
             * Remove the leftovers from the beta 5 to v5.0.0 upgrade
             */
            delete entry["ignore"];
            delete entry["savedOn"];
            delete entry["version"];
            elasticUpdates.push(
                entryElasticsearchEntity.putBatch({
                    ...entry,
                    data: {
                        ...data,
                        entryId,
                        tenant
                    }
                })
            );
        }

        const breakMs = 200;
        /**
         * Updating the Elasticsearch table is a bit tricky because it can break if overwhelmed.
         * We will take breakMs ms break between each recordsInABatch records
         */
        const elasticUpdatesChunks = lodashChunk(elasticUpdates, recordsInABatch);
        console.log(
            `[ELASTICSEARCH] Total chunks to be written with ${recordsInABatch} records in a batch: ${elasticUpdatesChunks.length}`
        );
        for (const elasticUpdateChunk of elasticUpdatesChunks) {
            try {
                await elasticTable.batchWrite(elasticUpdateChunk);
            } catch (ex) {
                throw new WebinyError(
                    "Error writing to Elasticsearch stream table.",
                    "STREAM_TABLE_WRITE_ERROR",
                    {
                        ex,
                        message: ex.message
                    }
                );
            }
            await sleep(breakMs);
        }
        console.log(`[ELASTICSEARCH] Streaming table updated records: ${elasticUpdates.length}`);
    }
});
