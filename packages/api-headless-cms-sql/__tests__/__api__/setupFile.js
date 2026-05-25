import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { registerSqlStorageOperations } from "../../src/index.js";
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
    const plugins = [...registerSqlStorageOperations({ knex })];

    return {
        storageOperations: {},
        plugins
    };
});
