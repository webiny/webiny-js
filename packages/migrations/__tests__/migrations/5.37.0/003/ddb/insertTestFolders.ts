import { Table } from "@webiny/db-dynamodb/toolbox";
import { insertDynamoDbTestData } from "~tests/utils";
import { ACO_FOLDER_MODEL_ID } from "~/migrations/5.37.0/003/constants";
import { FolderDdbItem, FolderDdbWriteItem } from "../types";
import { createOldFoldersData, Folder } from "./data";
import { createLocalesData, createTenantsData } from "../common";

interface Response {
    folders: Folder[];
    ddbFolders: FolderDdbItem[];
}

export const insertTestFolders = async (
    table: Table<string, string, string>
): Promise<Response> => {
    const folders = createOldFoldersData();
    const tenants = createTenantsData().map(tenant => tenant.data.id);
    const testLocales = createLocalesData();

    const items: FolderDdbWriteItem[] = [];
    const ddbFolders: FolderDdbItem[] = [];

    for (const tenant of tenants) {
        const locales = testLocales
            .filter(item => item.PK === `T#${tenant}#I18N#L`)
            .map(locale => locale.code);
        for (const locale of locales) {
            for (const folder of folders) {
                const { id, parent, title } = folder;

                const partitionKey = `T#${tenant}#L#${locale}#CMS#CME#CME#${id}`;

                const values = {
                    title: title,
                    slug: id,
                    parentId: parent,
                    type: "cms"
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
                /**
                 * This is for the verification purposes only.
                 */
                ddbFolders.push({
                    PK: partitionKey,
                    id,
                    locale,
                    tenant
                });
            }
        }
    }

    await insertDynamoDbTestData(table, items);

    return {
        folders,
        ddbFolders
    };
};
