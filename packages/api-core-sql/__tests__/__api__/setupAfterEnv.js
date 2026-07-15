import { beforeEach, afterAll } from "vitest";

async function dropAllTablesSqlite(knex) {
    const tables = await knex.raw(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    for (const { name } of tables) {
        await knex.schema.dropTableIfExists(name);
    }
}

beforeEach(async () => {
    const knex = global.__testKnex;
    if (!knex) {
        return;
    }

    if (global.__testClient) {
        await global.__testClient.dropAllTables(knex);
    } else {
        await dropAllTablesSqlite(knex);
    }

    const managers = globalThis.__sqlTableManagers || [];
    for (const manager of managers) {
        manager.reset();
    }
});

afterAll(async () => {
    if (global.__testClient) {
        await global.__testClient.teardown();
    } else {
        const knex = global.__testKnex;
        if (knex) {
            await knex.destroy();
        }
    }
});
