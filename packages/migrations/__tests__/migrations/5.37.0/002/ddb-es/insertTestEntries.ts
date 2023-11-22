import { Table } from "@webiny/db-dynamodb/toolbox";
import { insertDynamoDbTestData } from "~tests/utils";
import { transferDynamoDbToElasticsearch } from "~tests/utils/insertElasticsearchTestData";
import { ElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { createArticleEntry } from "~tests/migrations/5.37.0/002/ddb-es/mocks/entry";
import {
    createDynamoDbElasticsearchRecords,
    createDynamoDbRecords
} from "~tests/migrations/5.37.0/002/ddb-es/mocks/record";
import { createArticleModel } from "~tests/migrations/5.37.0/002/ddb-es/mocks/model";
import { getStorageModel } from "./mocks/storageModel";
import { getPlugins } from "./mocks/plugins";
import { getRecordIndexName } from "~tests/migrations/5.37.0/002/ddb-es/helpers";

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
const defaultMaxItems = 5;

const revisionsArray = Array(3)
    .fill(0)
    .map((_, index) => {
        return Number(index) + 1;
    });
/**
 * !!! IMPORTANT !!!
 * UPDATE IF YOU CHANGE THE NUMBER OF RECORDS PER ENTRY.
 * Which records are pushed into the DynamoDB?
 * - L
 * - P
 * - REV#0001
 * - REV#0002
 * - REV#0003
 */
export const ddbItemPushes = revisionsArray.length + 2;

interface Options {
    maxItems?: number;
    maxTenants?: number;
    maxLocales?: number;
}

interface Params {
    ddbTable: Table<string, string, string>;
    ddbToEsTable: Table<string, string, string>;
    elasticsearchClient: ElasticsearchClient;
    options?: Options;
}

export const insertTestEntries = async (params: Params) => {
    let entries = 0;
    const plugins = getPlugins();
    const { ddbTable, ddbToEsTable, elasticsearchClient, options } = params;
    const maxItems = options?.maxItems || defaultMaxItems;
    const maxTenants = options?.maxTenants || tenants.length + 1;
    const maxLocales = options?.maxLocales || locales.length + 1;

    let currentTenant = 0;
    for (const tenant of tenants) {
        currentTenant++;
        let currentLocale = 0;
        for (const locale of locales) {
            currentLocale++;
            const model = createArticleModel({
                tenant,
                locale,
                webinyVersion: "5.36.2"
            });
            const storageModel = getStorageModel(model);
            const items = [];
            const esItems = [];
            for (let i = 1; i <= maxItems; i++) {
                entries++;
                const entryId = `${tenant}-${locale}-${i}`;
                const revisions = revisionsArray.map(version => {
                    return createArticleEntry({
                        entryId,
                        tenant,
                        locale,
                        version,
                        published: version === revisionsArray.length - 1
                    });
                });

                const dynamoDbRecords = await createDynamoDbRecords({
                    plugins,
                    model: storageModel,
                    revisions
                });
                const dynamoDbElasticsearchRecords = await createDynamoDbElasticsearchRecords({
                    plugins,
                    model: storageModel,
                    revisions
                });

                items.push(...dynamoDbRecords);
                esItems.push(...dynamoDbElasticsearchRecords);
            }
            await insertDynamoDbTestData(ddbTable, items);
            await insertDynamoDbTestData(ddbToEsTable, esItems);
            await transferDynamoDbToElasticsearch(
                elasticsearchClient,
                ddbToEsTable,
                getRecordIndexName
            );
            if (currentLocale >= maxLocales) {
                break;
            }
        }
        if (currentTenant >= maxTenants) {
            return entries;
        }
    }
    return entries;
};
