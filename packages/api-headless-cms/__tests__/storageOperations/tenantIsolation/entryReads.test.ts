import { beforeEach, describe, expect, it, vi } from "vitest";
import { ListEntriesStorageOperation } from "~/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { GetEntryStorageOperation } from "~/features/shared/storageOperations/entry/GetEntryStorageOperation.js";
import { GetEntriesByIdsStorageOperation } from "~/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.js";
import { GetLatestEntriesByIdsStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestEntriesByIdsStorageOperation.js";
import { GetPublishedEntriesByIdsStorageOperation } from "~/features/shared/storageOperations/entry/GetPublishedEntriesByIdsStorageOperation.js";
import { GetRevisionsStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionsStorageOperation.js";
import { GetPreviousRevisionStorageOperation } from "~/features/shared/storageOperations/entry/GetPreviousRevisionStorageOperation.js";
import { GetUniqueFieldValuesStorageOperation } from "~/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";
import {
    createEntryInBothTenants,
    createIsolationModel,
    createRevisionId,
    ISOLATION_ENTRY_ID,
    TENANT_A,
    useStorageContainer
} from "./helpers";

vi.setConfig({
    testTimeout: 100_000
});

describe("Tenant isolation - entry reads", () => {
    const getContainer = useStorageContainer();
    const modelA = createIsolationModel(TENANT_A);

    beforeEach(async () => {
        await createEntryInBothTenants(getContainer());
    });

    it("list should return only the tenant's entries", async () => {
        const listEntries = getContainer().resolve(ListEntriesStorageOperation);

        const result = await listEntries.execute(modelA, { where: { latest: true }, limit: 100 });

        expect(result.items.map(item => [item.tenant, item.id])).toEqual([
            [TENANT_A, createRevisionId(2)]
        ]);
    });

    it("get should return only the tenant's entry", async () => {
        const getEntry = getContainer().resolve(GetEntryStorageOperation);

        const entry = await getEntry.execute(modelA, {
            where: { entryId: ISOLATION_ENTRY_ID, latest: true }
        });

        expect(entry?.tenant).toEqual(TENANT_A);
        expect(entry?.values.name).toEqual("isolation-a v2");
    });

    it("getByIds variants should return only the tenant's entries", async () => {
        const container = getContainer();
        const getByIds = container.resolve(GetEntriesByIdsStorageOperation);
        const getLatestByIds = container.resolve(GetLatestEntriesByIdsStorageOperation);
        const getPublishedByIds = container.resolve(GetPublishedEntriesByIdsStorageOperation);

        const byIds = await getByIds.execute(modelA, {
            ids: [createRevisionId(1), createRevisionId(2)]
        });
        const latest = await getLatestByIds.execute(modelA, { ids: [ISOLATION_ENTRY_ID] });
        const published = await getPublishedByIds.execute(modelA, { ids: [ISOLATION_ENTRY_ID] });

        expect(byIds.map(item => item.tenant)).toEqual([TENANT_A, TENANT_A]);
        expect(latest.map(item => [item.tenant, item.id])).toEqual([
            [TENANT_A, createRevisionId(2)]
        ]);
        expect(published.map(item => [item.tenant, item.id])).toEqual([
            [TENANT_A, createRevisionId(1)]
        ]);
    });

    it("revision reads should return only the tenant's revisions", async () => {
        const container = getContainer();
        const getRevisions = container.resolve(GetRevisionsStorageOperation);
        const getPreviousRevision = container.resolve(GetPreviousRevisionStorageOperation);

        const revisions = await getRevisions.execute(modelA, { id: ISOLATION_ENTRY_ID });
        const previous = await getPreviousRevision.execute(modelA, {
            entryId: ISOLATION_ENTRY_ID,
            version: 2
        });

        expect(revisions.map(item => item.tenant)).toEqual([TENANT_A, TENANT_A]);
        expect(previous?.tenant).toEqual(TENANT_A);
        expect(previous?.id).toEqual(createRevisionId(1));
    });

    it("unique field values should count only the tenant's entries", async () => {
        const getUniqueFieldValues = getContainer().resolve(GetUniqueFieldValuesStorageOperation);

        const values = await getUniqueFieldValues.execute(modelA, {
            where: { latest: true },
            fieldId: "name"
        });

        expect(values).toEqual([{ value: "isolation-a v2", count: 1 }]);
    });
});
