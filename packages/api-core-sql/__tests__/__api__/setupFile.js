import { setStorageOps } from "@webiny/api-core/testing/environment.js";
import { createApiCoreSql } from "~/createApiCoreSql.js";
import { setSqlServiceManifestLoader } from "~/connection/index.js";
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
    // What the SQL storage does when it registers in the root.
    setSqlServiceManifestLoader({ knex, tableNamePrefix });
    return {
        storageOperations: createApiCoreSql({ knex, tableNamePrefix }),
        plugins: []
    };
});
