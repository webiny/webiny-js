import { beforeEach, afterAll } from "vitest";
import { setupTestIndexManager } from "@webiny/api-opensearch/testing";

setupTestIndexManager({ global });

beforeEach(async () => {
    const knex = global.__testKnex;
    if (!knex) {
        return;
    }

    await global.__testClient.dropAllTables(knex);

    const managers = globalThis.__sqlTableManagers || [];
    for (const manager of managers) {
        manager.reset();
    }
});

afterAll(async () => {
    await global.__testClient.teardown();
});
