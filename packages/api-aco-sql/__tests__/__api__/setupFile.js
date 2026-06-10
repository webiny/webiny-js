import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { registerAcoSqlStorageOperations } from "../../src/index.js";
import knexLib from "knex";

const knex = knexLib({
    client: "better-sqlite3",
    connection: {
        filename: ":memory:"
    },
    useNullAsDefault: true
});

global.__testKnex = knex;

setStorageOps("aco", () => {
    return {
        storageOperations: {},
        plugins: [registerAcoSqlStorageOperations({ knex })]
    };
});
