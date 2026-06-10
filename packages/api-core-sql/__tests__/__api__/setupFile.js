import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createApiCoreSql } from "~/createApiCoreSql.js";
import { getSqlTablePrefix } from "~/getSqlTablePrefix.js";
import knexLib from "knex";

const knex = global.__testKnex || knexLib({
    client: "better-sqlite3",
    connection: {
        filename: ":memory:"
    },
    useNullAsDefault: true
});

global.__testKnex = knex;

const tableNamePrefix = getSqlTablePrefix();

setStorageOps("apiCore", () => {
    return {
        storageOperations: createApiCoreSql({ knex, tableNamePrefix }),
        plugins: []
    };
});
