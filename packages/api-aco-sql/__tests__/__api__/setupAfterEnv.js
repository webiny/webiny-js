import {
    beforeEach,
    afterAll
} from "vitest";

const getKnex = () => {
    return global.__testKnex;
};

beforeEach(async () => {
    const knex = getKnex();
    if (!knex) {
        return;
    }

    const tables = await knex.raw(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    for (const { name } of tables) {
        await knex.schema.dropTableIfExists(name);
    }
});

afterAll(async () => {
    const knex = getKnex();
    if (knex) {
        await knex.destroy();
    }
});
