import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { registerSqlStorageOperations } from "../../src/index.js";
import knexLib from "knex";

setStorageOps("cms", () => {
    const knex = knexLib({
        client: "better-sqlite3",
        connection: {
            filename: ":memory:"
        },
        useNullAsDefault: true
    });

    /* Store the knex instance globally so setupAfterEnv.js can access it. */
    global.__testKnex = knex;

    const plugins = [...registerSqlStorageOperations({ knex })];

    return {
        storageOperations: {},
        plugins
    };
});
