import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { registerWebsocketsSqlStorageOperations } from "../../src/index.js";

setStorageOps("websockets", () => {
    const knex = global.__testKnex;
    if (!knex) {
        throw new Error(
            "No global.__testKnex found. Websockets SQL presets require a knex instance from another SQL preset (e.g. api-headless-cms-sql)."
        );
    }

    return {
        storageOperations: {},
        plugins: [registerWebsocketsSqlStorageOperations({ knex })]
    };
});
