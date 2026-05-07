import { beforeEach } from "vitest";
import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createDatabase, migrate } from "@webiny/db-sqlite";
import { createApiCoreSqlite } from "../../src/createApiCoreSqlite.js";

/**
 * Storage state lives for the lifetime of the test file (mirrors how
 * dynalite works for the DDB variant — tables persist for the file). Between
 * tests we truncate the items table so state from one test doesn't leak into
 * the next; tests then rebuild what they need via `install.install()` or
 * direct storage-ops calls. Keeping the connection open is critical because
 * `useGqlHandler` calls `getStorageOps` once at describe level and reuses
 * the same storage-ops object for every test in the file.
 */
let testDb = null;

const ensureDb = () => {
    if (!testDb) {
        testDb = createDatabase();
        migrate(testDb.sqlite);
    }
    return testDb;
};

beforeEach(() => {
    if (testDb) {
        // Keep the connection open; just clear data + bookkeeping.
        testDb.sqlite.exec("DELETE FROM items;");
        testDb.sqlite.exec("DELETE FROM items_fts;");
    }
});

setStorageOps("apiCore", () => {
    const database = ensureDb();
    return {
        storageOperations: createApiCoreSqlite({ db: database }),
        plugins: []
    };
});
