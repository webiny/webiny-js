import { beforeEach } from "vitest";
import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createDatabase, migrate } from "@webiny/db-sqlite";
import { createGroupsStorageOperations } from "../../src/operations/group/index.js";
import { createModelsStorageOperations } from "../../src/operations/model/index.js";
import { createEntriesStorageOperations } from "../../src/operations/entry/index.js";

/**
 * Stage-6 CMS test preset. Currently exposes only the foundational storage
 * ops — Group + Model fully and basic Entry CRUD. Most api-headless-cms test
 * files exercise revision lifecycle / publish / moveToBin paths that aren't
 * implemented yet (stage 6b). Those tests will fail fast with a clear
 * NOT_IMPLEMENTED error rather than going green misleadingly.
 *
 * The DB connection is held open for the test file lifetime; rows are
 * truncated between tests to mirror the dynalite-shared-tables behavior of
 * the DDB variant.
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
        testDb.sqlite.exec("DELETE FROM items;");
        testDb.sqlite.exec("DELETE FROM items_fts;");
    }
});

setStorageOps("cms", () => {
    const database = ensureDb();
    return {
        storageOperations: {
            name: "sqlite",
            beforeInit: async () => {},
            groups: createGroupsStorageOperations({ db: database }),
            models: createModelsStorageOperations({ db: database }),
            entries: createEntriesStorageOperations({ db: database })
        },
        plugins: []
    };
});
