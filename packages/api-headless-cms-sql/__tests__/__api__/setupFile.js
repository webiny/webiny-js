import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { registerSqlStorageOperations } from "../../src/index.js";
import { createCmsEntryFieldSortingPlugin } from "@webiny/api-headless-cms-storage/plugins/CmsEntryFieldSortingPlugin.js";
import knexLib from "knex";

/* Create one shared knex instance so all handlers use the same in-memory database. */
const knex = knexLib({
    client: "better-sqlite3",
    connection: {
        filename: ":memory:"
    },
    useNullAsDefault: true
});

global.__testKnex = knex;

setStorageOps("cms", () => {
    const plugins = [
        ...registerSqlStorageOperations({ knex }),
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
