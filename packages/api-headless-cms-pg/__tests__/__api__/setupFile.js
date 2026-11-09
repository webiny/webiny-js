import { setStorageOps } from "@webiny/api-core/testing/environment.js";
import { HeadlessCmsPgFeature } from "../../src/index.js";
import { FieldSortingRegistry } from "@webiny/api-headless-cms-storage";
import { registerSQLCore } from "@webiny/api-core-sql";
import { createRegisterExtensionPlugin } from "@webiny/handler";

/*
 * pg is Postgres only: it uses jsonb, tsvector, GIN indexes and Postgres array operators.
 * By default the tests connect to a Postgres server (WEBINY_PG_*); WEBINY_SQL_CLIENT=pglite runs an
 * in-process PGlite instead, which needs no server (CI).
 */
const client =
    process.env.WEBINY_SQL_CLIENT === "pglite"
        ? await import("./createPgliteClient.js")
        : await import("./createPgClient.js");

const knex = global.__testKnex || (await client.createKnex());

global.__testKnex = knex;
global.__testClient = client;

const tableNamePrefix = process.env.SQL_TABLE_PREFIX || process.env.WEBINY_SQL_TABLE_PREFIX || "";

setStorageOps("cms", () => {
    const plugins = [
        registerSQLCore({
            knex
        }),
        createRegisterExtensionPlugin(context =>
            HeadlessCmsPgFeature.register(context.container, { knex, tableNamePrefix })
        ),
        createRegisterExtensionPlugin(({ container }) => {
            const sortingRegistry = container.resolve(FieldSortingRegistry);
            sortingRegistry.register({
                canUse: params => params.fieldId === "customSorter",
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
            });
        })
    ];

    return {
        storageOperations: {},
        plugins
    };
});
