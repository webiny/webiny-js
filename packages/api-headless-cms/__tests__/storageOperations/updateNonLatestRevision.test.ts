import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsModel } from "~/types";
import { createIdentifier } from "@webiny/utils";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { createPersonModel } from "./helpers";
import { createTestEntry } from "./entryFixtures";
import { CreateEntryStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { CreateEntryRevisionFromStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { UpdateEntryStorageOperation } from "~/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";

vi.setConfig({
    testTimeout: 100_000
});

const ENTRY_ID = "nonlatestupdate";

/**
 * The person model's fields have a `storageId` that differs from the `fieldId`
 * (`text@<id>` vs `name`), so values stored under the wrong key read back as missing.
 */
const createModel = (): CmsModel => {
    return {
        ...createPersonModel(),
        modelId: "nonLatestUpdateModel",
        group: "nonLatestUpdateGroup",
        icon: null
    };
};

describe("Storage operations - update a non-latest revision", () => {
    const handler = useGraphQLHandler({
        path: "manage"
    });

    let container: Container;

    beforeEach(async () => {
        await handler.isInstalledQuery();
        container = handler.getContext().container;
    });

    it("should keep the latest revision's values when an older revision is updated", async () => {
        const createEntry = container.resolve(CreateEntryStorageOperation);
        const createRevisionFrom = container.resolve(CreateEntryRevisionFromStorageOperation);
        const updateEntry = container.resolve(UpdateEntryStorageOperation);
        const getRevisionById = container.resolve(GetRevisionByIdStorageOperation);
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

        const second = createTestEntry({
            model,
            entryId: ENTRY_ID,
            version: 2,
            status: "draft",
            values: { name: "v2" }
        });
        await createRevisionFrom.execute(model, { entry: second, storageEntry: second });

        /**
         * Update v1, which is not the latest revision.
         * The latest revision (v2) gets its entry-level meta synced, but its values must stay.
         */
        const changedFirst = createTestEntry({
            model,
            entryId: ENTRY_ID,
            version: 1,
            status: "draft",
            values: { name: "v1 changed" }
        });
        await updateEntry.execute(model, { entry: changedFirst, storageEntry: changedFirst });

        const updatedFirst = await getRevisionById.execute(model, { id: changedFirst.id });
        const secondRevision = await getRevisionById.execute(model, {
            id: createIdentifier({ id: ENTRY_ID, version: 2 })
        });
        const latest = await getLatest.execute(model, { id: ENTRY_ID });

        expect(updatedFirst?.values.name).toEqual("v1 changed");
        expect(secondRevision?.values.name).toEqual("v2");
        expect(latest?.id).toEqual(second.id);
        expect(latest?.values.name).toEqual("v2");
    });
});
