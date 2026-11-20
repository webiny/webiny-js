import { describe, expect, it } from "vitest";
import type { Knex } from "knex";
import { Container } from "@webiny/feature/api";
import { KnexClient } from "@webiny/api-core-sql";
import { TableNameResolverConfig } from "~/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "~/features/tableNameResolver/feature.js";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { EntryTableManagerFeature } from "~/features/entryTableManager/feature.js";
import { ModelSchemaManager } from "~/features/modelSchemaManager/abstractions.js";
import { ModelSchemaManagerFeature } from "~/features/modelSchemaManager/feature.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { GroupSchemaManagerFeature } from "~/features/groupSchemaManager/feature.js";

/**
 * Schema setup creates the CMS tables in a transaction. If a later step fails, the transaction rolls
 * back and the tables with it: the process must not remember them as existing, or a retry in the
 * same process skips creating them.
 */

interface ITestGlobals {
    __testKnex: Knex;
}

const createContainer = (knex: Knex): Container => {
    const container = new Container();
    container.registerInstance(KnexClient, { client: knex });
    container.registerInstance(TableNameResolverConfig, { sharedTables: false });
    TableNameResolverFeature.register(container);
    EntryTableManagerFeature.register(container);
    ModelSchemaManagerFeature.register(container);
    GroupSchemaManagerFeature.register(container);
    return container;
};

const rollBack = async (knex: Knex, run: (container: Container) => Promise<void>) => {
    await expect(
        knex.transaction(async trx => {
            await run(createContainer(trx));
            throw new Error("A later step failed.");
        })
    ).rejects.toThrow("A later step failed.");
};

describe("CMS schema memory and a rolled-back transaction", () => {
    const knex = () => (globalThis as unknown as ITestGlobals).__testKnex;

    it("the entries table is created again after its transaction rolled back", async () => {
        const tableName = createContainer(knex()).resolve(EntryTableManager).getTableName();

        await rollBack(knex(), container => container.resolve(EntryTableManager).ensureTable());
        expect(await knex().schema.hasTable(tableName)).toBe(false);

        await createContainer(knex()).resolve(EntryTableManager).ensureTable();
        expect(await knex().schema.hasTable(tableName)).toBe(true);
    });

    it("a models table is created again after its transaction rolled back", async () => {
        const tableName = "rollback_test_models";

        await rollBack(knex(), container => container.resolve(ModelSchemaManager).setup(tableName));
        expect(await knex().schema.hasTable(tableName)).toBe(false);

        await createContainer(knex()).resolve(ModelSchemaManager).ensure(tableName);
        expect(await knex().schema.hasTable(tableName)).toBe(true);
    });

    it("a groups table is created again after its transaction rolled back", async () => {
        const tableName = "rollback_test_groups";

        await rollBack(knex(), container => container.resolve(GroupSchemaManager).setup(tableName));
        expect(await knex().schema.hasTable(tableName)).toBe(false);

        await createContainer(knex()).resolve(GroupSchemaManager).ensure(tableName);
        expect(await knex().schema.hasTable(tableName)).toBe(true);
    });
});
