import { describe, it, expect, beforeEach } from "vitest";
import knexLib from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Container } from "@webiny/feature/api";
import { KnexClient } from "@webiny/api-core-sql";
import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { CmsEntryOpenSearchFieldIndexFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import { CmsModelOpenSearchIndexFeature } from "@webiny/api-headless-cms-utils-os/features/CmsModelOpenSearchIndex/feature.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { SyncTableManagerFeature } from "../src/features/syncTableManager/feature.js";
import { SyncTableManager } from "../src/features/syncTableManager/abstractions.js";
import { SyncWriterFeature } from "../src/features/SyncWriter/feature.js";
import { WriteLatest } from "../src/features/SyncWriter/abstractions/WriteLatest.js";
import { WritePublished } from "../src/features/SyncWriter/abstractions/WritePublished.js";
import { RemoveLatest } from "../src/features/SyncWriter/abstractions/RemoveLatest.js";
import { RemovePublished } from "../src/features/SyncWriter/abstractions/RemovePublished.js";
import type { ISyncRow } from "../src/types.js";

const createModel = (overrides = {}) => ({
    modelId: "testModel",
    tenant: "root",
    locale: "en-US",
    name: "Test Model",
    fields: [],
    layout: [],
    group: { id: "group1", name: "Group 1", slug: "group-1" },
    convertValueKeyToStorage: ({ values }: any) => values,
    convertValueKeyFromStorage: ({ values }: any) => values,
    ...overrides
});

const createEntry = (overrides = {}) => ({
    id: "entry1#0001",
    entryId: "entry1",
    modelId: "testModel",
    tenant: "root",
    locale: "en-US",
    version: 1,
    status: "draft",
    locked: false,
    isLatest: true,
    isPublished: false,
    values: { title: "Test Entry" },
    ...overrides
});

describe("SyncWriter", () => {
    let knex: ReturnType<typeof knexLib>;
    let db: InstanceType<typeof PGlite>;
    let server: InstanceType<typeof PGLiteSocketServer>;

    beforeEach(async () => {
        db = await PGlite.create();
        server = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
        await server.start();

        knex = knexLib({
            client: "pg",
            connection: {
                host: "127.0.0.1",
                // @ts-expect-error
                port: server.port,
                database: "postgres"
            },
            pool: {
                min: 1,
                max: 1
            }
        });

        return async () => {
            await knex.destroy();
            await server.stop();
            await db.close();
        };
    });

    const setup = () => {
        const container = new Container();
        container.registerInstance(KnexClient, { client: knex });
        container.registerInstance(TableNameResolverConfig, { sharedTables: false });
        container.registerInstance(CmsModelFieldToGraphQLRegistry, {
            get: () => undefined,
            getAll: () => []
        });
        TableNameResolverFeature.register(container);
        CompressionFeature.register(container);
        CmsEntryOpenSearchFieldIndexFeature.register(container);
        CmsModelOpenSearchIndexFeature.register(container);
        SyncTableManagerFeature.register(container);
        SyncWriterFeature.register(container);

        const syncTableManager = container.resolve(SyncTableManager);
        const compressionHandler = container.resolve(CompressionHandler);
        const writeLatest = container.resolve(WriteLatest);
        const writePublished = container.resolve(WritePublished);
        const removeLatest = container.resolve(RemoveLatest);
        const removePublished = container.resolve(RemovePublished);

        return {
            syncTableManager,
            compressionHandler,
            writeLatest,
            writePublished,
            removeLatest,
            removePublished
        };
    };

    it("should write a latest sync record", async () => {
        const { syncTableManager, writeLatest, compressionHandler } = setup();
        await syncTableManager.ensureTable();

        const model = createModel() as any;
        const entry = createEntry() as any;

        await writeLatest.execute({ model, entry, storageEntry: entry });

        const rows: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("entry1:L");
        expect(rows[0].entryId).toBe("entry1");
        expect(rows[0].index).toContain("root-headless-cms-testmodel");
        expect(rows[0].operation).toBe("MODIFY");
        expect(rows[0].tenant).toBe("root");

        const data = JSON.parse(rows[0].data);
        expect(data.compression).toBe("gzip");
        expect(typeof data.value).toBe("string");

        const decompressed: any = await compressionHandler.decompress(data);
        expect(decompressed.latest).toBe(true);
        expect(decompressed.published).toBeUndefined();
        expect(decompressed.TYPE).toBe("cms.entry.l");
        expect(decompressed.__type).toBe("cms.entry.l");
        expect(decompressed.entryId).toBe("entry1");
    });

    it("should write a published sync record", async () => {
        const { syncTableManager, writePublished } = setup();
        await syncTableManager.ensureTable();

        const model = createModel() as any;
        const entry = createEntry({ status: "published" }) as any;

        await writePublished.execute({ model, entry, storageEntry: entry });

        const rows: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("entry1:P");
        expect(rows[0].operation).toBe("MODIFY");
    });

    it("should delete the row for removeLatest", async () => {
        const { syncTableManager, writeLatest, removeLatest } = setup();
        await syncTableManager.ensureTable();

        const model = createModel() as any;
        const entry = createEntry() as any;

        await writeLatest.execute({ model, entry, storageEntry: entry });

        const rowsBefore: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rowsBefore).toHaveLength(1);

        await removeLatest.execute({ model, entryId: entry.entryId });

        const rowsAfter: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rowsAfter).toHaveLength(0);
    });

    it("should delete the row for removePublished", async () => {
        const { syncTableManager, writePublished, removePublished } = setup();
        await syncTableManager.ensureTable();

        const model = createModel() as any;
        const entry = createEntry({ status: "published" }) as any;

        await writePublished.execute({ model, entry, storageEntry: entry });

        const rowsBefore: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rowsBefore).toHaveLength(1);

        await removePublished.execute({ model, entryId: entry.entryId });

        const rowsAfter: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rowsAfter).toHaveLength(0);
    });

    it("should upsert on conflict (same id) instead of duplicating rows", async () => {
        const { syncTableManager, writeLatest } = setup();
        await syncTableManager.ensureTable();

        const model = createModel() as any;
        const entry = createEntry() as any;

        await writeLatest.execute({ model, entry, storageEntry: entry });
        await writeLatest.execute({
            model,
            entry: { ...entry, values: { title: "Updated" } },
            storageEntry: { ...entry, values: { title: "Updated" } }
        });

        const rows: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("entry1:L");
    });

    it("should delete row on remove after write", async () => {
        const { syncTableManager, writeLatest, removeLatest } = setup();
        await syncTableManager.ensureTable();

        const model = createModel() as any;
        const entry = createEntry() as any;

        await writeLatest.execute({ model, entry, storageEntry: entry });
        await removeLatest.execute({ model, entryId: entry.entryId });

        const rows: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rows).toHaveLength(0);
    });
});
