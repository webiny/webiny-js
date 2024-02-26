import { ArticleCmsEntry, DynamoDbRecord } from "./types";
import { PluginsContainer } from "@webiny/plugins";
import { StorageOperationsCmsModel } from "@webiny/api-headless-cms/types";
import { entryToStorageTransform } from "@webiny/api-headless-cms";
import { getRecordIndexName } from "~tests/migrations/5.37.0/002/ddb-es/helpers";
import { createTransformer } from "@webiny/api-headless-cms-ddb-es/operations/entry/transformations";

interface ElasticsearchRecord {
    index: string;
    PK: string;
    SK: string;
    data: Record<string, any>;
}

interface CreateRecordsParams {
    plugins: PluginsContainer;
    revisions: ArticleCmsEntry[];
    model: StorageOperationsCmsModel;
}

export const createDynamoDbRecords = async (params: CreateRecordsParams) => {
    const { revisions: initialRevisions, plugins, model } = params;

    const revisions = (
        await Promise.all(
            initialRevisions.map(async entry => {
                return await entryToStorageTransform(
                    {
                        plugins
                    },
                    model,
                    entry
                );
            })
        )
    ).map(entry => {
        return {
            ...entry,
            values: model.convertValueKeyToStorage({
                fields: model.fields,
                values: entry.values
            })
        } as ArticleCmsEntry;
    });
    /**
     * First we convert all the entries into DynamoDB Records.
     */
    const records: DynamoDbRecord<ArticleCmsEntry>[] = revisions.map(entry => {
        const { entryId, version, tenant, locale } = entry;
        return {
            ...entry,
            version,
            PK: `T#${tenant}#L#${locale}#CMS#CME#${entryId}`,
            SK: `REV#${String(version).padStart(4, "0")}`,
            TYPE: "cms.entry",
            _et: "CmsEntries",
            _md: entry.savedOn,
            _ct: entry.createdOn
        };
    });
    /**
     * And then add latest...
     */
    const entry = records[records.length - 1];
    const { entryId, tenant, locale, version } = entry;
    records.push({
        ...entry,
        version,
        PK: `T#${tenant}#L#${locale}#CMS#CME#${entryId}`,
        SK: `L`,
        TYPE: "cms.entry.l",
        _et: "CmsEntries",
        _md: entry.savedOn,
        _ct: entry.createdOn
    });
    /**
     * ...and published record.
     */
    records.push({
        ...entry,
        version,
        PK: `T#${tenant}#L#${locale}#CMS#CME#${entryId}`,
        SK: `P`,
        TYPE: "cms.entry.p",
        _et: "CmsEntries",
        _md: entry.savedOn,
        _ct: entry.createdOn
    });

    return records;
};

export const createDynamoDbElasticsearchRecords = async (params: CreateRecordsParams) => {
    const { plugins, revisions, model } = params;
    const records: ElasticsearchRecord[] = [];

    const entry = revisions[revisions.length - 1];
    const storageEntry = await entryToStorageTransform(
        {
            plugins
        },
        model,
        entry
    );
    const { entryId, tenant, locale, modelId } = entry;

    const transformer = createTransformer({
        model,
        plugins,
        entry,
        storageEntry
    });
    /**
     * Elasticsearch Data
     */
    const index = getRecordIndexName({
        tenant,
        locale,
        modelId
    });
    const latestData = await transformer.getElasticsearchLatestEntryData();
    const publishedData = await transformer.getElasticsearchPublishedEntryData();
    records.push({
        PK: `T#${tenant}#L#${locale}#CMS#CME#${entryId}`,
        SK: `L`,
        index,
        data: latestData
    });
    records.push({
        PK: `T#${tenant}#L#${locale}#CMS#CME#${entryId}`,
        SK: `P`,
        index,
        data: publishedData
    });
    return records;
};
