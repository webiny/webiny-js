import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsEntry, CmsModel } from "~/types";
import { MoveEntryStorageOperation } from "~/features/shared/storageOperations/entry/MoveEntryStorageOperation.js";
import { MoveToBinStorageOperation } from "~/features/shared/storageOperations/entry/MoveToBinStorageOperation.js";
import { RestoreFromBinStorageOperation } from "~/features/shared/storageOperations/entry/RestoreFromBinStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import {
    createEntryInBothTenants,
    createIsolationEntry,
    createIsolationModel,
    createRevisionId,
    TENANT_A,
    TENANT_B,
    useStorageContainer
} from "./helpers";

vi.setConfig({
    testTimeout: 100_000
});

const createBinnedEntry = (model: CmsModel): CmsEntry => {
    return {
        ...createIsolationEntry({ model, version: 2, status: "draft" }),
        wbyDeleted: true,
        binOriginalFolderId: "root"
    };
};

describe("Tenant isolation - entry location", () => {
    const getContainer = useStorageContainer();
    const modelA = createIsolationModel(TENANT_A);
    const modelB = createIsolationModel(TENANT_B);

    beforeEach(async () => {
        await createEntryInBothTenants(getContainer());
    });

    it("move should move only the tenant's entry", async () => {
        const container = getContainer();
        const moveEntry = container.resolve(MoveEntryStorageOperation);
        const getRevisionById = container.resolve(GetRevisionByIdStorageOperation);

        await moveEntry.execute(modelA, createRevisionId(2), "folder-a");

        const a2 = await getRevisionById.execute(modelA, { id: createRevisionId(2) });
        const b2 = await getRevisionById.execute(modelB, { id: createRevisionId(2) });
        expect(a2?.location?.folderId).toEqual("folder-a");
        expect(b2?.location?.folderId).not.toEqual("folder-a");
    });

    it("moveToBin should bin only the tenant's entry", async () => {
        const container = getContainer();
        const moveToBin = container.resolve(MoveToBinStorageOperation);
        const getRevisionById = container.resolve(GetRevisionByIdStorageOperation);

        const binnedA = createBinnedEntry(modelA);
        await moveToBin.execute(modelA, { entry: binnedA, storageEntry: binnedA });

        const a2 = await getRevisionById.execute(modelA, { id: createRevisionId(2) });
        const b2 = await getRevisionById.execute(modelB, { id: createRevisionId(2) });
        expect(a2?.wbyDeleted).toBe(true);
        expect(b2?.wbyDeleted).toBeFalsy();
    });

    it("restoreFromBin should restore only the tenant's entry", async () => {
        const container = getContainer();
        const moveToBin = container.resolve(MoveToBinStorageOperation);
        const restoreFromBin = container.resolve(RestoreFromBinStorageOperation);
        const getRevisionById = container.resolve(GetRevisionByIdStorageOperation);

        for (const model of [modelA, modelB]) {
            const binned = createBinnedEntry(model);
            await moveToBin.execute(model, { entry: binned, storageEntry: binned });
        }

        const restored = createIsolationEntry({ model: modelA, version: 2, status: "draft" });
        await restoreFromBin.execute(modelA, { entry: restored, storageEntry: restored });

        const a2 = await getRevisionById.execute(modelA, { id: createRevisionId(2) });
        const b2 = await getRevisionById.execute(modelB, { id: createRevisionId(2) });
        expect(a2?.wbyDeleted).toBeFalsy();
        expect(b2?.wbyDeleted).toBe(true);
    });
});
