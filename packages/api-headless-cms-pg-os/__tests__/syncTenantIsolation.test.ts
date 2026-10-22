import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createSyncTestSetup, createModel, createEntry } from "./helpers/createSyncTestSetup";
import { RemoveEntry } from "../src/features/SyncWriter/abstractions/RemoveEntry.js";

const TENANT_A = "isolation-a";
const TENANT_B = "isolation-b";

describe("PG-OS sync rows - tenant isolation", () => {
    let setup: Awaited<ReturnType<typeof createSyncTestSetup>>;

    beforeAll(async () => {
        setup = await createSyncTestSetup();
    });

    afterAll(async () => {
        await setup.cleanup();
    });

    beforeEach(async () => {
        await setup.resetState();
    });

    it("should keep the same entryId apart across tenants", { timeout: 120_000 }, async () => {
        const modelA = createModel({ tenant: TENANT_A }) as any;
        const modelB = createModel({ tenant: TENANT_B }) as any;
        const entryA = createEntry({ tenant: TENANT_A, values: { title: "A" } }) as any;
        const entryB = createEntry({ tenant: TENANT_B, values: { title: "B" } }) as any;

        await setup.writeLatest.execute({ model: modelA, entry: entryA, storageEntry: entryA });
        await setup.writeLatest.execute({ model: modelB, entry: entryB, storageEntry: entryB });

        const inserts = setup.capturedEvents.filter(event => event.type === "INSERT");
        expect(inserts.map(event => event.tenant).sort()).toEqual([TENANT_A, TENANT_B]);

        const rows = await setup.knex(setup.syncTableManager.getTableName()).select("*");
        expect(rows).toHaveLength(2);

        await setup.removeLatest.execute({ model: modelA, entryId: entryA.entryId });

        const remaining = await setup.knex(setup.syncTableManager.getTableName()).select("*");
        expect(remaining).toHaveLength(1);
        expect(remaining[0].tenant).toEqual(TENANT_B);
        expect(remaining[0].id).toEqual("entry1:L");
    });

    it(
        "should remove only one tenant's latest and published rows",
        { timeout: 120_000 },
        async () => {
            const removeEntry = setup.container.resolve(RemoveEntry);
            const modelA = createModel({ tenant: TENANT_A }) as any;
            const modelB = createModel({ tenant: TENANT_B }) as any;
            const entryA = createEntry({
                tenant: TENANT_A,
                status: "published",
                values: { title: "A" }
            }) as any;
            const entryB = createEntry({
                tenant: TENANT_B,
                status: "published",
                values: { title: "B" }
            }) as any;

            /**
             * A published entry writes both the L and the P row.
             */
            await setup.writeEntry.execute({ model: modelA, entry: entryA, storageEntry: entryA });
            await setup.writeEntry.execute({ model: modelB, entry: entryB, storageEntry: entryB });

            const rows = await setup.knex(setup.syncTableManager.getTableName()).select("*");
            expect(rows).toHaveLength(4);

            await removeEntry.execute({ model: modelA, entryId: entryA.entryId });

            const remaining = await setup.knex(setup.syncTableManager.getTableName()).select("*");
            expect(remaining.map(row => `${row.tenant}:${row.id}`).sort()).toEqual([
                `${TENANT_B}:entry1:L`,
                `${TENANT_B}:entry1:P`
            ]);
        }
    );
});
