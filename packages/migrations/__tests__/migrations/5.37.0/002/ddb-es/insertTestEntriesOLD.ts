import { Table } from "dynamodb-toolbox";
import { CmsEntry, Identity } from "~/migrations/5.37.0/002/types";
import { insertDynamoDbTestData } from "~tests/utils";
import { esGetIndexName } from "~/utils";
import { transferDynamoDbToElasticsearch } from "~tests/utils/insertElasticsearchTestData";
import { ElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { getCompressedData } from "~/migrations/5.37.0/002/utils/getCompressedData";

type DbItem<T> = T & {
    PK: string;
    SK: string;
    TYPE: string;
    _et: string;
    _md: string;
    _ct: string;
};

const identity: Identity = {
    id: "root",
    displayName: "Root",
    type: "admin"
};

const tenants = [
    "root",
    "not-root",
    "webiny",
    "admin",
    "not-admin",
    "webiny-admin",
    "webiny-not-admin"
];
const locales = [
    "en-US",
    "de-DE",
    "fr-FR",
    "be-BE",
    "nl-NL",
    "hr-HR",
    "it-IT",
    "es-ES",
    "pt-PT",
    "pt-BR"
];
/**
 * Items generated per tenant / locale combination.
 * This is used in the test which actually updates everything.
 */
const defaultMaxItems = 25;
/**
 * !!! IMPORTANT !!!
 * UPDATE IF YOU CHANGE THE NUMBER OF RECORDS PER ENTRY.
 * Which records are pushed into the DynamoDB?
 * - L
 * - P
 * - REV#0001
 * - REV#0002
 */
const ddbItemPushes = 4;

export const getTotalItems = () => {
    return tenants.length * locales.length * defaultMaxItems * ddbItemPushes;
};

interface Options {
    maxItems?: number;
}

interface Params {
    ddbTable: Table;
    ddbToEsTable: Table;
    elasticsearchClient: ElasticsearchClient;
    options?: Options;
}

export const insertTestEntries = async (params: Params) => {
    const { ddbTable, ddbToEsTable, elasticsearchClient, options } = params;
    const maxItems = options?.maxItems || defaultMaxItems;
    for (const tenant of tenants) {
        const items = [];
        const esItems = [];
        for (const locale of locales) {
            for (let i = 1; i <= maxItems; i++) {
                const entryId = `${tenant}-${locale}-${i}`;

                const item: DbItem<CmsEntry> = {
                    PK: `T#${tenant}#L#${locale}#CMS#CME#${entryId}`,
                    SK: "REV#0001",
                    _et: "CmsEntries",
                    _md: new Date().toISOString(),
                    _ct: new Date().toISOString(),
                    tenant,
                    locale,
                    id: `${entryId}#0001`,
                    entryId,
                    modelId: "randomModelId",
                    TYPE: "cms.entry",
                    locked: true,
                    status: "published",
                    ownedBy: identity,
                    createdBy: identity,
                    createdOn: new Date().toISOString(),
                    savedOn: new Date().toISOString(),
                    publishedOn: new Date().toISOString(),
                    values: {
                        title: `Entry ${entryId}`
                    },
                    webinyVersion: "5.36.2",
                    version: 1
                };
                const itemV2 = {
                    ...item,
                    SK: "REV#0002",
                    id: `${entryId}#0002`,
                    version: 2
                };
                const latestItem = {
                    ...itemV2,
                    TYPE: "cms.entry.l",
                    SK: "L"
                };
                const publishedItem = {
                    ...latestItem,
                    TYPE: "cms.entry.p",
                    SK: "P"
                };
                // REV 1
                items.push(item);
                // REV 2
                items.push({
                    ...itemV2
                });
                // latest
                items.push({
                    ...latestItem,
                    SK: "L"
                });
                // published
                items.push({
                    ...publishedItem
                });
                /**
                 * Elasticsearch Data
                 */
                const index = esGetIndexName({
                    tenant,
                    locale,
                    type: "randomModelId",
                    isHeadlessCmsModel: true
                });
                esItems.push({
                    PK: item.PK,
                    SK: "L",
                    index,
                    data: await getCompressedData(latestItem)
                });
                esItems.push({
                    PK: item.PK,
                    SK: "P",
                    index,
                    data: await getCompressedData(publishedItem)
                });
            }
        }
        await insertDynamoDbTestData(ddbTable, items);
        await insertDynamoDbTestData(ddbToEsTable, esItems);
        await transferDynamoDbToElasticsearch(elasticsearchClient, ddbToEsTable, item => {
            return esGetIndexName({
                tenant: item.tenant,
                locale: item.locale,
                type: "randomModelId",
                isHeadlessCmsModel: true
            });
        });
    }
};
