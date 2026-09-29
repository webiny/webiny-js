import { describe, expect, it, vi } from "vitest";
import type { CmsModel } from "~/types";
import { createPersonModel } from "./helpers";
import { createTestEntry } from "./entryFixtures";
import { useStorageContainer } from "./useStorageContainer";
import { CreateEntryStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { CreateEntryRevisionFromStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { PublishEntryStorageOperation } from "~/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
import { DeleteMultipleEntriesStorageOperation } from "~/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.js";
import { GetRevisionsStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionsStorageOperation.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";

vi.setConfig({
    testTimeout: 100_000
});

const ENTRY_ID = "deletemultiple";

const createModel = (): CmsModel => {
    return {
        ...createPersonModel(),
        modelId: "deleteMultipleModel",
        group: "deleteMultipleGroup",
        icon: null
    };
};

describe("Storage operations - delete multiple entries", () => {
    const getContainer = useStorageContainer();

    it("should not return deleted entries when read right after deleting", async () => {
        const container = getContainer();
        const createEntry = container.resolve(CreateEntryStorageOperation);
        const createRevisionFrom = container.resolve(CreateEntryRevisionFromStorageOperation);
        const publishEntry = container.resolve(PublishEntryStorageOperation);
        const deleteMultiple = container.resolve(DeleteMultipleEntriesStorageOperation);
        const getRevisions = container.resolve(GetRevisionsStorageOperation);
        const getLatest = container.resolve(GetLatestRevisionByEntryIdStorageOperation);

        const model = createModel();
        const first = createTestEntry({
            model,
            entryId: ENTRY_ID,
            version: 1,
            status: "draft",
            values: { name: "v1" }
        });
        await createEntry.execute(model, { entry: first, storageEntry: first });

        /**
         * Publish v1, so the latest, published and revision records all exist.
         */
        const published = { ...first, status: "published" as const };
        await publishEntry.execute(model, { entry: published, storageEntry: published });

        const second = createTestEntry({
            model,
            entryId: ENTRY_ID,
            version: 2,
            status: "draft",
            values: { name: "v2" }
        });
        await createRevisionFrom.execute(model, { entry: second, storageEntry: second });

        await deleteMultiple.execute(model, { entries: [ENTRY_ID] });

        expect(await getRevisions.execute(model, { id: ENTRY_ID })).toHaveLength(0);
        expect(await getLatest.execute(model, { id: ENTRY_ID })).toBeNull();
    });
});
