import knexLib from "knex";
import { withKnexDefaults } from "@webiny/api-core-sql";

export function createKnex() {
    return knexLib(
        withKnexDefaults({
            client: "better-sqlite3",
            connection: {
                filename: ":memory:"
            },
            useNullAsDefault: true
        })
    );
}

export async function dropAllTables(knex) {
    const tables = await knex.raw(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    for (const { name } of tables) {
        await knex.schema.dropTableIfExists(name);
    }
}

export async function teardown() {
    const knex = global.__testKnex;
    if (knex) {
        global.__testKnex = null;
        await knex.destroy();
    }
}
