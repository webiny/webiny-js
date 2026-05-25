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

    /* Drop all tables and bump the schema reset version so SchemaRegistry caches are invalidated. */
    const tables = await knex.raw(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    for (const { name } of tables) {
        await knex.schema.dropTableIfExists(name);
    }
    globalThis.__schemaRegistryVersion = (globalThis.__schemaRegistryVersion || 0) + 1;
});

afterAll(async () => {
    const knex = getKnex();
    if (knex) {
        await knex.destroy();
    }
});
