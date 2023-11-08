import { Table } from "@webiny/db-dynamodb/toolbox";
import { insertDynamoDbTestData } from "~tests/utils";
import { ACO_FOLDER_MODEL_ID } from "~/migrations/5.37.0/003/constants";
import {
    FolderDdbEsWriteItem,
    FolderDdbItem,
    FolderDdbToElasticsearchWriteItem,
    FolderItem
} from "../types";
import { createOldFoldersData, Folder } from "./data";
import { createLocalesData, createTenantsData } from "../common";
import { insertElasticsearchTestData } from "~tests/utils/insertElasticsearchTestData";
import { esCreateIndex, esGetIndexName } from "~/utils";
import { ElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { getElasticsearchLatestEntryData } from "~/migrations/5.37.0/003/ddb-es/latestElasticsearchData";

interface TenantsResponse {
    tenant: string;
    locales: string[];
}

interface Response {
    folders: Folder[];
    ddbFolders: FolderDdbItem[];
    tenants: TenantsResponse[];
}

interface Params {
    elasticsearchClient: ElasticsearchClient;
    table: Table<string, string, string>;
    esTable: Table<string, string, string>;
}

export const insertTestFolders = async (params: Params): Promise<Response> => {
    const { table, esTable, elasticsearchClient } = params;
    const folders = createOldFoldersData();
    const testLocales = createLocalesData();
    const tenants = createTenantsData()
        .map(tenant => tenant.data.id)
        .map(tenant => {
            return {
                tenant,
                locales: testLocales
                    .filter(item => item.PK === `T#${tenant}#I18N#L`)
                    .map(locale => locale.code)
            };
        });

    const ddbItems: FolderDdbEsWriteItem[] = [];
    const ddbToEsItems: FolderDdbToElasticsearchWriteItem[] = [];
    const esItems: any[] = [];
    const ddbFolders: FolderDdbItem[] = [];

    for (const tenant of tenants) {
        for (const locale of tenant.locales) {
            for (const folder of folders) {
                const { id, parent, title } = folder;

                const partitionKey = `T#${tenant.tenant}#L#${locale}#CMS#CME#${id}`;

                const values = {
                    title,
                    slug: id,
                    parentId: parent,
                    type: "cms"
                };

                /**
                 * Exact entry revision.
                 */
                ddbItems.push({
                    PK: partitionKey,
                    SK: "REV#0001",
                    id: `${id}#0001`,
                    entryId: id,
                    locale,
                    locked: false,
                    modelId: ACO_FOLDER_MODEL_ID,
                    status: "draft",
                    tenant: tenant.tenant,
                    TYPE: "cms.entry",
                    values
                });
                /**
                 * Latest entry revision.
                 */
                ddbItems.push({
                    PK: partitionKey,
                    SK: "L",
                    id: `${id}#0001`,
                    entryId: id,
                    locale,
                    locked: false,
                    modelId: ACO_FOLDER_MODEL_ID,
                    status: "draft",
                    tenant: tenant.tenant,
                    TYPE: "cms.entry.l",
                    values
                });

                const folderItem: FolderItem = {
                    id: `${id}#0001`,
                    entryId: id,
                    locale,
                    locked: false,
                    modelId: ACO_FOLDER_MODEL_ID,
                    status: "draft",
                    tenant: tenant.tenant,
                    TYPE: "cms.entry.l",
                    values
                };

                const latestElasticsearchData = await getElasticsearchLatestEntryData({
                    ...folderItem
                });
                ddbToEsItems.push({
                    PK: partitionKey,
                    SK: "L",
                    index: esGetIndexName({
                        tenant: tenant.tenant,
                        locale,
                        isHeadlessCmsModel: true,
                        type: ACO_FOLDER_MODEL_ID
                    }),
                    data: latestElasticsearchData
                });

                esItems.push({
                    ...folderItem,
                    PK: partitionKey,
                    SK: "L",
                    latest: true,
                    TYPE: "cms.entry.l",
                    __type: "cms.entry.l"
                });
                /**
                 * This is for the verification purposes only.
                 */
                ddbFolders.push({
                    PK: partitionKey,
                    id,
                    locale,
                    tenant: tenant.tenant
                });
            }
        }
    }

    await insertDynamoDbTestData(table, ddbItems);
    await insertDynamoDbTestData(esTable, ddbToEsItems);
    await insertElasticsearchTestData(elasticsearchClient, esItems, item => {
        return esGetIndexName({
            tenant: item.tenant,
            locale: item.locale,
            isHeadlessCmsModel: true,
            type: ACO_FOLDER_MODEL_ID
        });
    });
    await elasticsearchClient.indices.refreshAll();

    return {
        folders,
        ddbFolders,
        tenants
    };
};

export const insertEmptyIndexes = async (client: ElasticsearchClient): Promise<any> => {
    const testLocales = createLocalesData();
    const tenants = createTenantsData()
        .map(tenant => tenant.data.id)
        .map(tenant => {
            return {
                tenant,
                locales: testLocales
                    .filter(item => item.PK === `T#${tenant}#I18N#L`)
                    .map(locale => locale.code)
            };
        });

    for (const tenant of tenants) {
        for (const locale of tenant.locales) {
            await esCreateIndex({
                elasticsearchClient: client,
                tenant: tenant.tenant,
                locale,
                type: ACO_FOLDER_MODEL_ID,
                isHeadlessCmsModel: true
            });
        }
    }
};
