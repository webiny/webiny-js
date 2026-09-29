import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteEntryRevisionStorageOperation } from "~/features/shared/storageOperations/entry/DeleteEntryRevisionStorageOperation.js";
import { DeleteMultipleEntriesStorageOperation } from "~/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { GetRevisionsStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionsStorageOperation.js";
import {
    createEntryInBothTenants,
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

describe("Tenant isolation - entry deletion", () => {
    const getContainer = useStorageContainer();
    const modelA = createIsolationModel(TENANT_A);
    const modelB = createIsolationModel(TENANT_B);

    beforeEach(async () => {
        await createEntryInBothTenants(getContainer());
    });

    it("deleteRevision should delete only the tenant's revision", async () => {
        const container = getContainer();
        const deleteRevision = container.resolve(DeleteEntryRevisionStorageOperation);
        const getRevisionById = container.resolve(GetRevisionByIdStorageOperation);
        const getLatest = container.resolve(GetLatestRevisionByEntryIdStorageOperation);

        const a2 = createIsolationEntry({ model: modelA, version: 2, status: "draft" });
        const a1 = createIsolationEntry({ model: modelA, version: 1, status: "published" });
        await deleteRevision.execute(modelA, {
            entry: a2,
            storageEntry: a2,
            latestEntry: a1,
            latestStorageEntry: a1
        });

        const deletedA2 = await getRevisionById.execute(modelA, { id: createRevisionId(2) });
        const b2 = await getRevisionById.execute(modelB, { id: createRevisionId(2) });
        const latestB = await getLatest.execute(modelB, { id: ISOLATION_ENTRY_ID });
        expect(deletedA2).toBeNull();
        expect(b2?.values.name).toEqual("isolation-b v2");
        expect(latestB?.id).toEqual(createRevisionId(2));
    });

    it("deleteMultiple should delete only the tenant's entry", async () => {
        const container = getContainer();
        const deleteMultiple = container.resolve(DeleteMultipleEntriesStorageOperation);
        const getRevisions = container.resolve(GetRevisionsStorageOperation);

        await deleteMultiple.execute(modelA, { entries: [ISOLATION_ENTRY_ID] });

        const revisionsA = await getRevisions.execute(modelA, { id: ISOLATION_ENTRY_ID });
        const revisionsB = await getRevisions.execute(modelB, { id: ISOLATION_ENTRY_ID });
        expect(revisionsA).toHaveLength(0);
        expect(revisionsB.map(item => item.tenant)).toEqual([TENANT_B, TENANT_B]);
    });
});
