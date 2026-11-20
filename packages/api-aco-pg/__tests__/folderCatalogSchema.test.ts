import { describe, expect, it, vi } from "vitest";
import type { Knex } from "knex";
import { Container } from "@webiny/feature/api";
import { KnexClient } from "@webiny/api-core-sql";
import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import {
    FolderCatalogSchema,
    FolderCatalogSchemaImplementation
} from "~/catalog/FolderCatalogSchema.js";

/**
 * Schema setup runs every step in one transaction. A later step can still fail and roll it back, and
 * the catalog tables with it: the process may only remember them once that transaction commits.
 */

/* A transaction whose statements are recorded, and which the test commits or rolls back. */
const createTransaction = (config: object) => {
    let commit: () => void = () => undefined;
    let rollBack: () => void = () => undefined;
    const executionPromise = new Promise<void>((resolve, reject) => {
        commit = resolve;
        rollBack = () => reject(new Error("rolled back"));
    });
    executionPromise.catch(() => undefined);
    const raw = vi.fn(async () => ({ rows: [] }));
    const transaction = vi.fn();
    const trx = {
        isTransaction: true,
        client: { config },
        raw,
        transaction,
        executionPromise
    } as unknown as Knex.Transaction;
    return { trx, raw, transaction, commit, rollBack };
};

/* The catalog schema as the setup container builds it: its connection is the setup transaction. */
const resolveSchema = (trx: Knex.Transaction): FolderCatalogSchema.Interface => {
    const container = new Container();
    container.registerInstance(KnexClient, { client: trx });
    container.registerInstance(TableNameResolverConfig, { sharedTables: false });
    container.register(FolderCatalogSchemaImplementation);
    return container.resolve(FolderCatalogSchema);
};

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe("FolderCatalogSchema in a schema-setup transaction", () => {
    it("creates the tables again after the setup transaction rolled back", async () => {
        const config = {};
        const setup = createTransaction(config);
        await resolveSchema(setup.trx).setup();
        expect(setup.raw).toHaveBeenCalled();
        // Created on the setup transaction itself, not on a savepoint marked done when it ends.
        expect(setup.transaction).not.toHaveBeenCalled();

        setup.rollBack();
        await settle();

        const next = createTransaction(config);
        await resolveSchema(next.trx).ensure();
        expect(next.raw).toHaveBeenCalled();
    });

    it("remembers the tables once the setup transaction commits", async () => {
        const config = {};
        const setup = createTransaction(config);
        await resolveSchema(setup.trx).setup();

        // Not yet committed: another use still creates them.
        const before = createTransaction(config);
        await resolveSchema(before.trx).ensure();
        expect(before.raw).toHaveBeenCalled();

        setup.commit();
        await settle();

        const after = createTransaction(config);
        await resolveSchema(after.trx).ensure();
        expect(after.raw).not.toHaveBeenCalled();
    });

    it("doesn't remember the tables when a reset came before the commit", async () => {
        const config = {};
        const setup = createTransaction(config);
        const schema = resolveSchema(setup.trx);
        await schema.setup();

        // Test setups drop every table and reset the memory before the transaction ends.
        schema.reset();
        setup.commit();
        await settle();

        const next = createTransaction(config);
        await resolveSchema(next.trx).ensure();
        expect(next.raw).toHaveBeenCalled();
    });
});
