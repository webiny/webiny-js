import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStorageContainer } from "../useStorageContainer";
import { DeleteMultipleEntriesStorageOperation } from "~/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { createEntryInBothModels, createRevisionId, ENTRY_X, modelX, modelY } from "./helpers";

vi.setConfig({
    testTimeout: 100_000
});

/**
 * Writes through model Y with the entry of model X must leave that entry unchanged.
 *
 * Only deleteMultiple is here: every storage checks the model while loading the revisions.
 * Update, delete, move and moveToBin write by key on DynamoDB (PK = tenant + entryId, no model),
 * so their cross-model tests live in the api-headless-cms-sql package.
 */
describe("Model isolation - entry writes", () => {
    const getContainer = useStorageContainer();

    beforeEach(async () => {
        await createEntryInBothModels(getContainer());
    });

    it("deleteMultiple should not delete another model's entry", async () => {
        const container = getContainer();
        const deleteMultiple = container.resolve(DeleteMultipleEntriesStorageOperation);
        const getRevisionById = container.resolve(GetRevisionByIdStorageOperation);

        await deleteMultiple.execute(modelY, { entries: [ENTRY_X] });

        const entryX = await getRevisionById.execute(modelX, { id: createRevisionId(ENTRY_X) });
        expect(entryX).not.toBeNull();
    });
});
