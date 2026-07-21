import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createSyncTestSetup, createModel, createEntry } from "./helpers/createSyncTestSetup";
import { createReindexEvents } from "../src/testing/createReindexEvents.js";
import type { SyncEventHandler } from "../src/features/syncEventHandler/abstractions.js";

const isOsAvailable = !!process.env.OPENSEARCH_PORT || !!process.env.OPENSEARCH_ENDPOINT;

describe.skipIf(!isOsAvailable)("PG-to-OpenSearch sync stream", () => {
    let setup: Awaited<ReturnType<typeof createSyncTestSetup>>;
    let syncEventHandler: SyncEventHandler.Interface;

    beforeAll(async () => {
        setup = await createSyncTestSetup();
    });

    afterAll(async () => {
        await setup.cleanup();
    });

    beforeEach(async () => {
        await setup.resetState();
        syncEventHandler = setup.resolveSyncEventHandler();
    });

    it("should sync an INSERT event to OpenSearch", { timeout: 120_000 }, async () => {
        const model = createModel() as any;
        const entry = createEntry() as any;

        await setup.syncWriter.writeLatest({ model, entry, storageEntry: entry });

        expect(setup.capturedEvents).toHaveLength(1);
        expect(setup.capturedEvents[0].type).toBe("INSERT");
        expect(setup.capturedEvents[0].id).toBe("entry1:L");

        await syncEventHandler.process(setup.capturedEvents);

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: setup.capturedEvents[0].index,
            body: { query: { match_all: {} } }
        });

        expect(body.hits.total.value).toBe(1);
        expect(body.hits.hits[0]._id).toBe("entry1:L");
        expect(body.hits.hits[0]._source.entryId).toBe("entry1");
        expect(body.hits.hits[0]._source.TYPE).toBe("cms.entry.l");
        expect(body.hits.hits[0]._source.__type).toBe("cms.entry.l");
    });

    it("should sync a MODIFY event to OpenSearch", { timeout: 120_000 }, async () => {
        const model = createModel() as any;
        const entry = createEntry() as any;

        await setup.syncWriter.writeLatest({ model, entry, storageEntry: entry });

        await syncEventHandler.process(setup.capturedEvents);
        setup.capturedEvents.length = 0;

        const updatedEntry = { ...entry, values: { title: "Updated Title" } };
        await setup.syncWriter.writeLatest({
            model,
            entry: updatedEntry,
            storageEntry: updatedEntry
        });

        expect(setup.capturedEvents).toHaveLength(1);
        expect(setup.capturedEvents[0].type).toBe("MODIFY");

        await syncEventHandler.process(setup.capturedEvents);

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: setup.capturedEvents[0].index,
            body: { query: { match_all: {} } }
        });

        expect(body.hits.total.value).toBe(1);
    });

    it("should sync a REMOVE event to delete from OpenSearch", { timeout: 120_000 }, async () => {
        const model = createModel() as any;
        const entry = createEntry() as any;

        await setup.syncWriter.writeLatest({ model, entry, storageEntry: entry });

        const indexName = setup.capturedEvents[0].index;

        await syncEventHandler.process(setup.capturedEvents);
        setup.capturedEvents.length = 0;

        await setup.syncWriter.removeLatest({ model, entryId: entry.entryId });

        expect(setup.capturedEvents).toHaveLength(1);
        expect(setup.capturedEvents[0].type).toBe("REMOVE");
        expect(setup.capturedEvents[0].id).toBe("entry1:L");

        await syncEventHandler.process(setup.capturedEvents);

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: indexName,
            body: { query: { match_all: {} } },
            ignore_unavailable: true
        });

        expect(body.hits.total.value).toBe(0);
    });

    it("should respect batchSize option", { timeout: 120_000 }, async () => {
        const model = createModel() as any;

        for (let i = 1; i <= 5; i++) {
            const entry = createEntry({
                id: `entry${i}#0001`,
                entryId: `entry${i}`
            }) as any;
            await setup.syncWriter.writeLatest({ model, entry, storageEntry: entry });
        }

        expect(setup.capturedEvents).toHaveLength(5);

        const indexName = setup.capturedEvents[0].index;

        await syncEventHandler.process(setup.capturedEvents, { batchSize: 2 });

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: indexName,
            body: { query: { match_all: {} } }
        });

        expect(body.hits.total.value).toBe(5);
    });

    it("should sync both latest and published records", { timeout: 120_000 }, async () => {
        const model = createModel() as any;
        const entry = createEntry({ status: "published" }) as any;

        await setup.syncWriter.writeEntry({ model, entry, storageEntry: entry });

        expect(setup.capturedEvents).toHaveLength(2);
        const ids = setup.capturedEvents.map(e => e.id).sort();
        expect(ids).toEqual(["entry1:L", "entry1:P"]);

        const indexName = setup.capturedEvents[0].index;

        await syncEventHandler.process(setup.capturedEvents);

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: indexName,
            body: { query: { match_all: {} } }
        });

        expect(body.hits.total.value).toBe(2);

        const hits = body.hits.hits.sort((a: any, b: any) => a._id.localeCompare(b._id));
        expect(hits[0]._id).toBe("entry1:L");
        expect(hits[0]._source.TYPE).toBe("cms.entry.l");
        expect(hits[1]._id).toBe("entry1:P");
        expect(hits[1]._source.TYPE).toBe("cms.entry.p");
    });

    it("should reindex all entries from os_sync", { timeout: 120_000 }, async () => {
        const model = createModel() as any;

        for (let i = 1; i <= 3; i++) {
            const entry = createEntry({
                id: `entry${i}#0001`,
                entryId: `entry${i}`
            }) as any;
            await setup.syncWriter.writeLatest({ model, entry, storageEntry: entry });
        }

        setup.capturedEvents.length = 0;

        const reindexEvents = await createReindexEvents(
            setup.knex,
            setup.syncTableManager.getTableName()
        );

        expect(reindexEvents).toHaveLength(3);
        expect(reindexEvents.every(e => e.type === "INSERT")).toBe(true);

        const indexName = reindexEvents[0].index;

        await syncEventHandler.process(reindexEvents);

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: indexName,
            body: { query: { match_all: {} } }
        });

        expect(body.hits.total.value).toBe(3);
    });
});
