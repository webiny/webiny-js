import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStorageContainer } from "../useStorageContainer";
import { GetRevisionByIdStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { GetEntriesByIdsStorageOperation } from "~/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.js";
import { GetLatestEntriesByIdsStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestEntriesByIdsStorageOperation.js";
import { GetPublishedEntriesByIdsStorageOperation } from "~/features/shared/storageOperations/entry/GetPublishedEntriesByIdsStorageOperation.js";
import { GetRevisionsStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionsStorageOperation.js";
import { GetPreviousRevisionStorageOperation } from "~/features/shared/storageOperations/entry/GetPreviousRevisionStorageOperation.js";
import { ListEntriesStorageOperation } from "~/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { GetEntryStorageOperation } from "~/features/shared/storageOperations/entry/GetEntryStorageOperation.js";
import { GetUniqueFieldValuesStorageOperation } from "~/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";
import {
    createEntryInBothModels,
    createRevisionId,
    ENTRY_X,
    ENTRY_Y,
    MODEL_Y,
    modelY
} from "./helpers";

vi.setConfig({
    testTimeout: 100_000
});

/**
 * Every read goes through model Y with the id of the entry in model X, and must find nothing.
 */
describe("Model isolation - entry reads", () => {
    const getContainer = useStorageContainer();

    beforeEach(async () => {
        await createEntryInBothModels(getContainer());
    });

    it("single revision reads should not find another model's entry", async () => {
        const container = getContainer();
        const getRevisionById = container.resolve(GetRevisionByIdStorageOperation);
        const getLatest = container.resolve(GetLatestRevisionByEntryIdStorageOperation);
        const getPublished = container.resolve(GetPublishedRevisionByEntryIdStorageOperation);
        const getPreviousRevision = container.resolve(GetPreviousRevisionStorageOperation);

        expect(await getRevisionById.execute(modelY, { id: createRevisionId(ENTRY_X) })).toBeNull();
        expect(await getLatest.execute(modelY, { id: ENTRY_X })).toBeNull();
        expect(await getPublished.execute(modelY, { id: ENTRY_X })).toBeNull();
        expect(
            await getPreviousRevision.execute(modelY, { entryId: ENTRY_X, version: 2 })
        ).toBeNull();
    });

    it("multiple entry reads should not find another model's entries", async () => {
        const container = getContainer();
        const getByIds = container.resolve(GetEntriesByIdsStorageOperation);
        const getLatestByIds = container.resolve(GetLatestEntriesByIdsStorageOperation);
        const getPublishedByIds = container.resolve(GetPublishedEntriesByIdsStorageOperation);
        const getRevisions = container.resolve(GetRevisionsStorageOperation);

        expect(await getByIds.execute(modelY, { ids: [createRevisionId(ENTRY_X)] })).toEqual([]);
        expect(await getLatestByIds.execute(modelY, { ids: [ENTRY_X] })).toEqual([]);
        expect(await getPublishedByIds.execute(modelY, { ids: [ENTRY_X] })).toEqual([]);
        expect(await getRevisions.execute(modelY, { id: ENTRY_X })).toEqual([]);
    });

    it("list, get and unique values should return only the model's entries", async () => {
        const container = getContainer();
        const listEntries = container.resolve(ListEntriesStorageOperation);
        const getEntry = container.resolve(GetEntryStorageOperation);
        const getUniqueFieldValues = container.resolve(GetUniqueFieldValuesStorageOperation);

        const list = await listEntries.execute(modelY, { where: { latest: true }, limit: 100 });
        expect(list.items.map(item => [item.modelId, item.entryId])).toEqual([[MODEL_Y, ENTRY_Y]]);

        const entry = await getEntry.execute(modelY, { where: { entryId: ENTRY_X, latest: true } });
        expect(entry).toBeNull();

        const values = await getUniqueFieldValues.execute(modelY, {
            where: { latest: true },
            fieldId: "name"
        });
        expect(values).toEqual([{ value: `${MODEL_Y} entry`, count: 1 }]);
    });
});
