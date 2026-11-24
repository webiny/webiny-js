import { describe, expect, it } from "vitest";
import type { Knex } from "knex";
import { Container } from "@webiny/feature/api";
import { KnexClient, SqlSchemaConfig } from "@webiny/api-core-sql";
import { TableNameResolverConfig } from "~/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "~/features/tableNameResolver/feature.js";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { EntryTableManagerFeature } from "~/features/entryTableManager/feature.js";

/**
 * With a managed schema, schema setup creates the entries table before the API takes traffic, so an
 * entry operation must not check for it (no `information_schema` query on the write path), not even
 * inside a transaction. Schema setup itself still creates it.
 */

interface ITestGlobals {
    __testKnex: Knex;
}

const createContainer = (knex: Knex): Container => {
    const container = new Container();
    container.registerInstance(KnexClient, { client: knex });
    container.registerInstance(SqlSchemaConfig, { isManaged: () => true });
    container.registerInstance(TableNameResolverConfig, { sharedTables: false });
    TableNameResolverFeature.register(container);
    EntryTableManagerFeature.register(container);
    return container;
};

describe("CMS entries table with a managed schema", () => {
    const knex = () => (globalThis as unknown as ITestGlobals).__testKnex;

    it("ensureTable() makes no check inside a transaction, and setup() creates the table", async () => {
        const tableName = createContainer(knex()).resolve(EntryTableManager).getTableName();
        await knex().schema.dropTableIfExists(tableName);

        await knex().transaction(async trx => {
            await createContainer(trx).resolve(EntryTableManager).ensureTable();
        });
        await createContainer(knex()).resolve(EntryTableManager).ensureTable();
        expect(await knex().schema.hasTable(tableName)).toBe(false);

        await createContainer(knex()).resolve(EntryTableManager).setup();
        expect(await knex().schema.hasTable(tableName)).toBe(true);
    });
});
