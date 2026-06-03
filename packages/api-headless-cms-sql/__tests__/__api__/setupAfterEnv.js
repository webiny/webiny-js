import { beforeEach, afterAll } from "vitest";

/* Clean all tables before each test to ensure isolation. */
const getKnex = () => {
    return global.__testKnex;
};

beforeEach(async () => {
    const knex = getKnex();
    if (!knex) {
        return;
    }

    /* Drop all tables to ensure clean state. */
    const tables = await knex.raw(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    for (const { name } of tables) {
        await knex.schema.dropTableIfExists(name);
    }

    /* Bump schema manager versions so the initialized flags reset. */
    globalThis.__entryTableManagerVersion = (globalThis.__entryTableManagerVersion || 0) + 1;
    globalThis.__schemaManagerVersion = (globalThis.__schemaManagerVersion || 0) + 1;
});

afterAll(async () => {
    const knex = getKnex();
    if (knex) {
        await knex.destroy();
    }
});
