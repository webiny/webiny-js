import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnpublishEntryStorageOperation } from "~/features/shared/storageOperations/entry/UnpublishEntryStorageOperation.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import {
    createEntryInBothTenants,
    createIsolationEntry,
    createIsolationModel,
    createRevisionId,
    ISOLATION_ENTRY_ID,
    TENANT_A,
    TENANT_B
} from "./helpers";
import { useStorageContainer } from "../useStorageContainer";

vi.setConfig({
    testTimeout: 100_000
});

describe("Tenant isolation - entry publishing", () => {
    const getContainer = useStorageContainer();
    const modelA = createIsolationModel(TENANT_A);
    const modelB = createIsolationModel(TENANT_B);

    beforeEach(async () => {
        await createEntryInBothTenants(getContainer());
    });

    it("unpublish should affect only the tenant's entry", async () => {
        const container = getContainer();
        const unpublishEntry = container.resolve(UnpublishEntryStorageOperation);
        const getPublished = container.resolve(GetPublishedRevisionByEntryIdStorageOperation);

        const unpublished = createIsolationEntry({
            model: modelA,
            version: 1,
            status: "unpublished"
        });
        await unpublishEntry.execute(modelA, { entry: unpublished, storageEntry: unpublished });

        const publishedA = await getPublished.execute(modelA, { id: ISOLATION_ENTRY_ID });
        const publishedB = await getPublished.execute(modelB, { id: ISOLATION_ENTRY_ID });
        expect(publishedA).toBeNull();
        expect(publishedB?.id).toEqual(createRevisionId(1));
        expect(publishedB?.status).toEqual("published");
    });
});
