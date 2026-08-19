import { setStorageOps } from "@webiny/api-core/testing/environment.js";
import { registerAcoSqlStorageOperations } from "../../src/index.js";

setStorageOps("aco", () => {
    const knex = global.__testKnex;
    if (!knex) {
        throw new Error(
            "No global.__testKnex found. ACO SQL presets require a knex instance from another SQL preset (e.g. api-headless-cms-sql)."
        );
    }

    return {
        storageOperations: {},
        plugins: [registerAcoSqlStorageOperations({ knex })]
    };
});
