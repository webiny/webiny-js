import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { KnexClient } from "@webiny/api-core-sql/feature/KnexClient/KnexClient.js";
import { WebsocketsConnectionRegistry } from "../../src/index.js";
import { TableName } from "../../src/TableName/TableName.js";

setStorageOps("websockets", () => {
    const knex = global.__testKnex;
    if (!knex) {
        throw new Error(
            "No global.__testKnex found. Websockets SQL presets require a knex instance from another SQL preset (e.g. api-headless-cms-sql)."
        );
    }

    const tableNamePrefix =
        process.env.SQL_TABLE_PREFIX || process.env.WEBINY_SQL_TABLE_PREFIX || "";

    return {
        storageOperations: {},
        // Websockets storage is wired through DI now. We hand the test handlers a factory for the
        // real SQL-backed registry, and each handler registers it against ITS OWN
        // ConnectionRegistry token. Registering a DI feature here instead would bind the registry to
        // this package's (dist) view of the token, which wouldn't match the consuming package's
        // (src) token under vitest's tsconfig-paths resolution. Mirrors api-websockets-ddb.
        createConnectionRegistry: () =>
            new WebsocketsConnectionRegistry(
                new KnexClient({ knex }),
                new TableName(tableNamePrefix)
            ),
        plugins: []
    };
});
