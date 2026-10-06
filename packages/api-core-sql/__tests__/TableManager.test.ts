import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { afterEach } from "vitest";
import knexLib from "knex";
import type { Knex } from "knex";
import { Container } from "@webiny/feature/api";
import { ApiCoreStorageOperationsFactory } from "@webiny/api-core";
import { TableManager } from "~/TableManager.js";
import { ApiCoreSqlFeature } from "~/ApiCoreSqlFeature.js";

const createKnex = (): Knex => {
    return knexLib({
        client: "better-sqlite3",
        connection: {
            filename: ":memory:"
        },
        useNullAsDefault: true
    });
};

const getRegisteredManagers = () => {
    const g = globalThis as Record<string, unknown>;
    const managers = (g.__sqlTableManagers ?? []) as unknown[];
    return managers.length;
};

const createItemsTable = (table: Knex.CreateTableBuilder) => {
    table.text("id").primary();
};

describe("TableManager", () => {
    let knex: Knex | undefined;

    afterEach(async () => {
        await knex?.destroy();
        knex = undefined;
    });

    it("creates a table once when concurrent callers ensure it at the same time", async () => {
        knex = createKnex();
        const tableManager = new TableManager(knex);

        const calls = Array.from({ length: 5 }, () => {
            return tableManager.ensure("items", createItemsTable);
        });
        await Promise.all(calls);

        const exists = await knex.schema.hasTable("items");
        expect(exists).toBe(true);
    });

    it("succeeds when the table was created by someone else in the meantime", async () => {
        knex = createKnex();
        const first = new TableManager(knex);
        const second = new TableManager(knex);

        const calls = [
            first.ensure("items", createItemsTable),
            second.ensure("items", createItemsTable)
        ];
        await Promise.all(calls);

        const exists = await knex.schema.hasTable("items");
        expect(exists).toBe(true);
    });
});

describe("ApiCoreSqlFeature", () => {
    let knex: Knex | undefined;

    afterEach(async () => {
        await knex?.destroy();
        knex = undefined;
    });

    it("builds the storage operations once, however many requests create them", () => {
        knex = createKnex();
        const container = new Container();
        const before = getRegisteredManagers();

        ApiCoreSqlFeature.register(container, { knex });
        const factory = container.resolve(ApiCoreStorageOperationsFactory);

        // ApiCoreFeature calls create() once per request.
        const first = factory.create();
        const second = factory.create();
        const third = factory.create();

        const after = getRegisteredManagers();

        expect(second).toBe(first);
        expect(third).toBe(first);
        expect(after - before).toBe(1);
    });
});
