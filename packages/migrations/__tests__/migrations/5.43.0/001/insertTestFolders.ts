import type { Table } from "@webiny/db-dynamodb/toolbox";
import { insertDynamoDbTestData } from "~tests/utils";
import { createFolderData } from "./data";
import { createLocalesData, createTenantsData } from "./common";

const ACO_FOLDER_MODEL_ID = "acoFolder";

export const insertTestFolders = async (table: Table<string, string, string>, type: string) => {
    const tenants = createTenantsData().map(tenant => tenant.data.id);
    const testLocales = createLocalesData();

    const data = [];
    const items = [];

    for (const tenant of tenants) {
        const locales = testLocales
            .filter(item => item.PK === `T#${tenant}#I18N#L`)
            .map(locale => locale.code);
        for (const locale of locales) {
            const foldersData = createFolderData();

            data.push(...foldersData);

            for (const folder of foldersData) {
                const { id, parentId, title, slug, permissions } = folder;

                const partitionKey = `T#${tenant}#L#${locale}#CMS#CME#CME#${id}`;

                const values = {
                    "text@title": title,
                    "text@slug": slug,
                    "text@parentId": parentId ? `${parentId}#0001` : null,
                    "object@permissions": permissions,
                    "text@type": type
                };
                /**
                 * Exact entry revision.
                 */
                items.push({
                    PK: partitionKey,
                    SK: "REV#0001",
                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#${ACO_FOLDER_MODEL_ID}#A`,
                    GSI1_SK: `${id}#0001`,
                    id: `${id}#0001`,
                    entryId: id,
                    locale,
                    locked: false,
                    modelId: ACO_FOLDER_MODEL_ID,
                    status: "draft",
                    tenant,
                    TYPE: "cms.entry",
                    values
                });
                /**
                 * Latest entry revision.
                 */
                items.push({
                    PK: partitionKey,
                    SK: "L",
                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#${ACO_FOLDER_MODEL_ID}#L`,
                    GSI1_SK: `${id}#0001`,
                    id: `${id}#0001`,
                    entryId: id,
                    locale,
                    locked: false,
                    modelId: ACO_FOLDER_MODEL_ID,
                    status: "draft",
                    tenant,
                    TYPE: "cms.entry.l",
                    values
                });
            }
        }
    }

    await insertDynamoDbTestData(table, items);

    return {
        foldersData: data,
        folderItems: items
    };
};
