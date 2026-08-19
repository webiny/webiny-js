import { setStorageOps } from "@webiny/api-core/testing/environment.js";
import { createApiCoreSql } from "~/createApiCoreSql.js";
import { getSqlTablePrefix } from "~/getSqlTablePrefix.js";
import knexLib from "knex";

if (!global.__testKnex) {
    global.__testKnex = knexLib({
        client: "better-sqlite3",
        connection: {
            filename: ":memory:"
        },
        useNullAsDefault: true
    });
}

const knex = global.__testKnex;
const tableNamePrefix = getSqlTablePrefix();

setStorageOps("apiCore", () => {
    return {
        storageOperations: createApiCoreSql({ knex, tableNamePrefix }),
        plugins: []
    };
});
