import { describe, expect, it } from "vitest";
import type { Knex } from "knex";
import { Container } from "@webiny/di";
import { KnexClient } from "@webiny/api-core-sql";
import {
    ScopeTenant,
    TenantScopeMismatchError,
    createFixedScopeTenant
} from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { CreateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { UpdateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import type { CmsEntry, CmsModel, CmsStorageEntry } from "@webiny/api-headless-cms/types/index.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import { PgCreateEntry } from "~/operations/entry/PgCreateEntry.js";
import { PgGetRevisionById } from "~/operations/entry/PgGetRevisionById.js";
import { PgUpdateEntry } from "~/operations/entry/PgUpdateEntry.js";

/*
 * The entry operations with a fake query layer, no database: they act on the tenant of the scope
 * they were built in, and throw when a caller passes another one.
 */

interface IQueryCall {
    table: string;
    where: unknown[];
    insert?: Record<string, unknown>;
    update?: Record<string, unknown>;
}

const createFakeDb = () => {
    const calls: IQueryCall[] = [];
    const db = ((table: string) => {
        const call: IQueryCall = { table, where: [] };
        calls.push(call);
        const builder = {
            where(...args: unknown[]) {
                call.where.push(args.length === 1 ? args[0] : args);
                return builder;
            },
            andWhere(...args: unknown[]) {
                call.where.push(args.length === 1 ? args[0] : args);
                return builder;
            },
            first: async () => undefined,
            insert: async (row: Record<string, unknown>) => {
                call.insert = row;
            },
            update: async (row: Record<string, unknown>) => {
                call.update = row;
            }
        };
        return builder;
    }) as unknown as Knex & { transaction: unknown };
    db.transaction = async (callback: (trx: Knex) => Promise<unknown>) => callback(db);
    return { db, calls };
};

const tables: PgSchema.Tables = {
    entries: "entries",
    search: "search",
    scopes: "scopes",
    values: "values",
    valueDeltas: "value_deltas"
};

const createContainer = (scopeTenantId: string) => {
    const { db, calls } = createFakeDb();
    const synced: string[][] = [];
    const container = new Container();
    container.registerInstance(KnexClient, { client: db });
    container.registerInstance(PgSchema, {
        ensure: async () => {},
        setup: async () => {},
        getTables: () => tables,
        reset: () => {}
    });
    container.registerInstance(SearchIndexer, {
        syncEntries: async (_trx, _model, entryIds) => {
            synced.push(entryIds);
        },
        reindexEntries: async () => ({ indexed: 0, cursor: null })
    });
    container.registerInstance(CmsStorageModelProvider, {
        getModel: (model: CmsModel) =>
            ({
                ...model,
                convertValueKeyToStorage: ({ values }: { values: unknown }) => values,
                convertValueKeyFromStorage: ({ values }: { values: unknown }) => values
            }) as unknown as ReturnType<CmsStorageModelProvider.Interface["getModel"]>
    } as unknown as CmsStorageModelProvider.Interface);
    container.registerInstance(ScopeTenant, createFixedScopeTenant(scopeTenantId));
    container.register(PgCreateEntry);
    container.register(PgGetRevisionById);
    container.register(PgUpdateEntry);
    return { container, calls, synced };
};

const model = (tenant: string) =>
    ({ tenant, modelId: "article", fields: [] }) as unknown as CmsModel;

const entry = (tenant: string) =>
    ({
        id: "abc#0001",
        entryId: "abc",
        version: 1,
        tenant,
        modelId: "article",
        status: "draft",
        values: {}
    }) as unknown as CmsEntry & CmsStorageEntry;

describe("entry storage operations take the tenant of their scope", () => {
    it("writes the scope's tenant", async () => {
        const { container, calls } = createContainer("root");
        const create = container.resolve(CreateEntryStorageOperation);

        await create.execute(model("root"), { entry: entry("root"), storageEntry: entry("root") });

        const insert = calls.find(call => call.insert)!.insert!;
        expect(insert.tenant).toBe("root");
        expect(JSON.parse(insert.data as string).tenant).toBe("root");
    });

    it("throws for a model of another tenant, before touching the database", async () => {
        const { container, calls, synced } = createContainer("root");
        const create = container.resolve(CreateEntryStorageOperation);

        const error = await create
            .execute(model("other"), { entry: entry("other"), storageEntry: entry("other") })
            .catch(e => e);

        expect(error).toBeInstanceOf(TenantScopeMismatchError);
        expect(error.data).toEqual({ scopeTenantId: "root", passedTenantId: "other" });
        expect(calls).toEqual([]);
        expect(synced).toEqual([]);
    });

    it("throws for an entry of another tenant, though the model is the scope's", async () => {
        const { container, calls } = createContainer("root");
        const update = container.resolve(UpdateEntryStorageOperation);

        await expect(
            update.execute(model("root"), { entry: entry("root"), storageEntry: entry("other") })
        ).rejects.toBeInstanceOf(TenantScopeMismatchError);
        expect(calls).toEqual([]);
    });

    it("reads with the scope's tenant, and refuses another one", async () => {
        const { container, calls } = createContainer("root");
        const get = container.resolve(GetRevisionByIdStorageOperation);

        await get.execute(model("root"), { id: "abc#0001" });
        expect(calls[0].where[0]).toEqual({ tenant: "root", model_id: "article" });

        await expect(get.execute(model("other"), { id: "abc#0001" })).rejects.toBeInstanceOf(
            TenantScopeMismatchError
        );
        expect(calls).toHaveLength(1);
    });
});
