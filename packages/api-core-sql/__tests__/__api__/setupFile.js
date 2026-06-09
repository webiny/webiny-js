import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createApiCoreSql } from "~/createApiCoreSql.js";
import knexLib from "knex";

const knex = knexLib({
    client: "better-sqlite3",
    connection: {
        filename: ":memory:"
    },
    useNullAsDefault: true
});

global.__testKnex = knex;

setStorageOps("apiCore", () => {
    return {
        storageOperations: createApiCoreSql({ knex }),
        plugins: []
    };
});
