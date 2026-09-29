import { describe, expect, it, vi } from "vitest";
import { CreateEntryStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { CreateEntryRevisionFromStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { UpdateEntryStorageOperation } from "~/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { PublishEntryStorageOperation } from "~/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { DeleteEntryStorageOperation } from "~/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import {
    createIsolationEntry,
    createIsolationModel,
    createRevisionId,
    ISOLATION_ENTRY_ID,
    TENANT_A,
    TENANT_B,
    useStorageContainer
} from "./helpers";

vi.setConfig({
    testTimeout: 100_000
});

/**
 * Revisions are created interleaved (A1, B1, A2, B2, then a published A3), so each
 * id-only query in a storage operation has a same-id row in the other tenant to hit by mistake.
 */
describe("Tenant isolation - entry revisions", () => {
    const getContainer = useStorageContainer();

    it("should keep revisions, latest and published apart across tenants", async () => {
        const container = getContainer();
        const createEntry = container.resolve(CreateEntryStorageOperation);
        const createRevisionFrom = container.resolve(CreateEntryRevisionFromStorageOperation);
        const updateEntry = container.resolve(UpdateEntryStorageOperation);
        const publishEntry = container.resolve(PublishEntryStorageOperation);
        const getRevisionById = container.resolve(GetRevisionByIdStorageOperation);
        const getLatest = container.resolve(GetLatestRevisionByEntryIdStorageOperation);
        const getPublished = container.resolve(GetPublishedRevisionByEntryIdStorageOperation);
        const deleteEntry = container.resolve(DeleteEntryStorageOperation);

        const modelA = createIsolationModel(TENANT_A);
        const modelB = createIsolationModel(TENANT_B);
        const id1 = createRevisionId(1);
        const id2 = createRevisionId(2);

        /**
         * v1 in both tenants, published in both tenants.
         */
        for (const model of [modelA, modelB]) {
            const draft = createIsolationEntry({ model, version: 1, status: "draft" });
            await createEntry.execute(model, { entry: draft, storageEntry: draft });
            const published = createIsolationEntry({ model, version: 1, status: "published" });
            await publishEntry.execute(model, { entry: published, storageEntry: published });
        }

        /**
         * v2 in tenant A only. Tenant B's v1 must stay latest.
         * Catches the id-only `isLatest` reset in SqlCreateEntryRevisionFrom.
         */
        const a2 = createIsolationEntry({ model: modelA, version: 2, status: "draft" });
        await createRevisionFrom.execute(modelA, { entry: a2, storageEntry: a2 });

        const latestBBeforeB2 = await getLatest.execute(modelB, { id: ISOLATION_ENTRY_ID });
        expect(latestBBeforeB2?.id).toEqual(id1);
        expect(latestBBeforeB2?.tenant).toEqual(TENANT_B);

        const b2 = createIsolationEntry({ model: modelB, version: 2, status: "draft" });
        await createRevisionFrom.execute(modelB, { entry: b2, storageEntry: b2 });

        /**
         * Update the non-latest revision in tenant A.
         * Catches the unscoped latest-row sync in syncEntryToLatest.
         */
        const changedA1 = createIsolationEntry({
            model: modelA,
            version: 1,
            status: "published",
            name: "isolation-a v1 changed"
        });
        await updateEntry.execute(modelA, { entry: changedA1, storageEntry: changedA1 });

        const a1AfterUpdate = await getRevisionById.execute(modelA, { id: id1 });
        const b1AfterUpdate = await getRevisionById.execute(modelB, { id: id1 });
        const b2AfterUpdate = await getRevisionById.execute(modelB, { id: id2 });
        expect(a1AfterUpdate?.values.name).toEqual("isolation-a v1 changed");
        expect(b1AfterUpdate?.values.name).toEqual("isolation-b v1");
        expect(b2AfterUpdate?.values.name).toEqual("isolation-b v2");
        expect(b2AfterUpdate?.tenant).toEqual(TENANT_B);
        /**
         * An unscoped `.first()` may pick either tenant's v2 row, so check both v2 rows.
         */
        const a2AfterUpdate = await getRevisionById.execute(modelA, { id: id2 });
        expect(a2AfterUpdate?.values.name).toEqual("isolation-a v2");
        expect(a2AfterUpdate?.tenant).toEqual(TENANT_A);

        /**
         * Publish v2 in tenant A. Tenant B's v1 must stay published.
         * Catches the id-only "unpublish previous" update in SqlPublishEntry.
         */
        const publishedA2 = createIsolationEntry({
            model: modelA,
            version: 2,
            status: "published"
        });
        await publishEntry.execute(modelA, { entry: publishedA2, storageEntry: publishedA2 });

        const publishedA = await getPublished.execute(modelA, { id: ISOLATION_ENTRY_ID });
        const publishedB = await getPublished.execute(modelB, { id: ISOLATION_ENTRY_ID });
        const latestB = await getLatest.execute(modelB, { id: ISOLATION_ENTRY_ID });
        expect(publishedA?.id).toEqual(id2);
        expect(publishedB?.id).toEqual(id1);
        expect(publishedB?.status).toEqual("published");
        expect(publishedB?.values.name).toEqual("isolation-b v1");
        expect(latestB?.id).toEqual(id2);
        expect(latestB?.values.name).toEqual("isolation-b v2");

        /**
         * Create a published v3 in tenant A. Tenant B's revisions must keep their flags.
         * Catches the id-only "unpublish previous" update in SqlCreateEntryRevisionFrom.
         */
        const publishedA3 = createIsolationEntry({
            model: modelA,
            version: 3,
            status: "published"
        });
        await createRevisionFrom.execute(modelA, {
            entry: publishedA3,
            storageEntry: publishedA3
        });

        const publishedBAfterA3 = await getPublished.execute(modelB, {
            id: ISOLATION_ENTRY_ID
        });
        const b2AfterA3 = await getRevisionById.execute(modelB, { id: id2 });
        expect(publishedBAfterA3?.id).toEqual(id1);
        expect(publishedBAfterA3?.status).toEqual("published");
        expect(b2AfterA3?.status).toEqual("draft");

        /**
         * Delete the whole entry in tenant A. Tenant B keeps both revisions.
         */
        await deleteEntry.execute(modelA, { entry: publishedA2 });

        expect(await getRevisionById.execute(modelA, { id: id1 })).toBeNull();
        expect(await getRevisionById.execute(modelA, { id: id2 })).toBeNull();
        const remainingB1 = await getRevisionById.execute(modelB, { id: id1 });
        const remainingB2 = await getRevisionById.execute(modelB, { id: id2 });
        expect(remainingB1?.values.name).toEqual("isolation-b v1");
        expect(remainingB2?.values.name).toEqual("isolation-b v2");

        await deleteEntry.execute(modelB, { entry: b2 });
    });
});
