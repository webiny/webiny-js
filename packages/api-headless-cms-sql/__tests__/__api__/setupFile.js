import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { registerSqlStorageOperations } from "../../src/index.js";
import { createCmsEntryFieldSortingPlugin } from "@webiny/api-headless-cms-storage/plugins/CmsEntryFieldSortingPlugin.js";
import { registerSQLCore } from "@webiny/api-core-sql";

const isPg = process.env.WEBINY_SQL_CLIENT === "pg";

const client = isPg ? await import("./createPgClient.js") : await import("./createSqliteClient.js");

const knex = global.__testKnex || (await client.createKnex());

global.__testKnex = knex;
global.__testClient = client;

const tableNamePrefix = process.env.SQL_TABLE_PREFIX || process.env.WEBINY_SQL_TABLE_PREFIX || "";

setStorageOps("cms", () => {
    const plugins = [
        registerSQLCore({
            knex
        }),
        ...registerSqlStorageOperations({ knex, tableNamePrefix }),
        createCmsEntryFieldSortingPlugin({
            canUse: params => {
                const { fieldId } = params;
                return fieldId === "customSorter";
            },
            createSort: params => {
                const { order, fields } = params;

                const field = Object.values(fields).find(f => f.fieldId === "createdBy");
                if (!field) {
                    throw new Error("Impossible, but it seems there is no field createdBy.");
                }
                return {
                    reverse: order === "DESC",
                    valuePath: "createdBy.id",
                    field,
                    fieldId: field.fieldId
                };
            }
        })
    ];

    return {
        storageOperations: {},
        plugins
    };
});
