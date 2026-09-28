import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsEntry, CmsEntryStatus, CmsGroup, CmsIdentity, CmsModel } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { createPersonModel } from "./helpers";
import { CreateModelStorageOperation } from "~/features/shared/storageOperations/model/CreateModelStorageOperation.js";
import { GetModelStorageOperation } from "~/features/shared/storageOperations/model/GetModelStorageOperation.js";
import { UpdateModelStorageOperation } from "~/features/shared/storageOperations/model/UpdateModelStorageOperation.js";
import { DeleteModelStorageOperation } from "~/features/shared/storageOperations/model/DeleteModelStorageOperation.js";
import { CreateGroupStorageOperation } from "~/features/shared/storageOperations/group/CreateGroupStorageOperation.js";
import { GetGroupStorageOperation } from "~/features/shared/storageOperations/group/GetGroupStorageOperation.js";
import { UpdateGroupStorageOperation } from "~/features/shared/storageOperations/group/UpdateGroupStorageOperation.js";
import { DeleteGroupStorageOperation } from "~/features/shared/storageOperations/group/DeleteGroupStorageOperation.js";
import { createIdentifier } from "@webiny/utils";
import { CreateEntryStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { CreateEntryRevisionFromStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { UpdateEntryStorageOperation } from "~/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { PublishEntryStorageOperation } from "~/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { DeleteEntryStorageOperation } from "~/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";

vi.setConfig({
    testTimeout: 100_000
});

const TENANT_A = "isolation-a";
const TENANT_B = "isolation-b";

/**
 * `createPersonModel()` returns `group` as an object, but `CmsModel.group` is a string.
 * better-sqlite3 cannot bind an object, so override `group` and `icon` here.
 */
const createIsolationModel = (tenant: string): CmsModel => {
    return {
        ...createPersonModel(),
        modelId: "isolationModel",
        name: "Isolation Model",
        group: "isolationGroup",
        icon: null,
        tenant
    };
};

const createIsolationGroup = (tenant: string): CmsGroup => {
    return {
        id: "isolationGroup",
        name: "Isolation Group",
        slug: "isolation-group",
        tenant,
        description: null,
        icon: null
    };
};

const ISOLATION_ENTRY_ID = "isolationentry";

const identity: CmsIdentity = {
    id: "admin",
    type: "admin",
    displayName: "admin"
};

interface CreateIsolationEntryParams {
    model: CmsModel;
    version: number;
    status: CmsEntryStatus;
    name?: string;
}

const createIsolationEntry = (params: CreateIsolationEntryParams): CmsEntry => {
    const { model, version, status } = params;
    const now = new Date().toISOString();
    return {
        id: createIdentifier({ id: ISOLATION_ENTRY_ID, version }),
        entryId: ISOLATION_ENTRY_ID,
        tenant: model.tenant,
        modelId: model.modelId,
        version,
        locked: false,
        status,
        values: {
            name: params.name ?? `${model.tenant} v${version}`
        },
        createdOn: now,
        savedOn: now,
        modifiedOn: null,
        deletedOn: null,
        restoredOn: null,
        firstPublishedOn: null,
        lastPublishedOn: null,
        createdBy: identity,
        savedBy: identity,
        modifiedBy: null,
        deletedBy: null,
        restoredBy: null,
        firstPublishedBy: null,
        lastPublishedBy: null,
        revisionCreatedOn: now,
        revisionSavedOn: now,
        revisionModifiedOn: null,
        revisionDeletedOn: null,
        revisionRestoredOn: null,
        revisionFirstPublishedOn: null,
        revisionLastPublishedOn: null,
        revisionCreatedBy: identity,
        revisionSavedBy: identity,
        revisionModifiedBy: null,
        revisionDeletedBy: null,
        revisionRestoredBy: null,
        revisionFirstPublishedBy: null,
        revisionLastPublishedBy: null,
        live: null,
        revisionDescription: undefined,
        expiresAt: null
    };
};

describe("Storage operations - tenant isolation", () => {
    const handler = useGraphQLHandler({
        path: "manage"
    });

    let container: Container;

    beforeEach(async () => {
        await handler.isInstalledQuery();
        container = handler.getContext().container;
    });

    describe("models", () => {
        it("should keep the same modelId apart across tenants on update and delete", async () => {
            const createModel = container.resolve(CreateModelStorageOperation);
            const getModel = container.resolve(GetModelStorageOperation);
            const updateModel = container.resolve(UpdateModelStorageOperation);
            const deleteModel = container.resolve(DeleteModelStorageOperation);

            const modelA = createIsolationModel(TENANT_A);
            const modelB = createIsolationModel(TENANT_B);

            await createModel.execute({ model: modelA });
            await createModel.execute({ model: modelB });

            await updateModel.execute({
                model: {
                    ...modelA,
                    name: "Changed in A"
                }
            });

            const updatedA = await getModel.execute({
                tenant: TENANT_A,
                modelId: modelA.modelId
            });
            const untouchedB = await getModel.execute({
                tenant: TENANT_B,
                modelId: modelB.modelId
            });
            expect(updatedA?.name).toEqual("Changed in A");
            expect(untouchedB?.name).toEqual("Isolation Model");

            await deleteModel.execute({ model: modelA });

            const deletedA = await getModel.execute({
                tenant: TENANT_A,
                modelId: modelA.modelId
            });
            const remainingB = await getModel.execute({
                tenant: TENANT_B,
                modelId: modelB.modelId
            });
            expect(deletedA).toBeNull();
            expect(remainingB?.name).toEqual("Isolation Model");

            await deleteModel.execute({ model: modelB });
        });
    });

    describe("groups", () => {
        it("should keep the same group id apart across tenants on update and delete", async () => {
            const createGroup = container.resolve(CreateGroupStorageOperation);
            const getGroup = container.resolve(GetGroupStorageOperation);
            const updateGroup = container.resolve(UpdateGroupStorageOperation);
            const deleteGroup = container.resolve(DeleteGroupStorageOperation);

            const groupA = createIsolationGroup(TENANT_A);
            const groupB = createIsolationGroup(TENANT_B);

            await createGroup.execute({ group: groupA });
            await createGroup.execute({ group: groupB });

            await updateGroup.execute({
                group: {
                    ...groupA,
                    name: "Changed in A"
                }
            });

            const updatedA = await getGroup.execute({ tenant: TENANT_A, id: groupA.id });
            const untouchedB = await getGroup.execute({ tenant: TENANT_B, id: groupB.id });
            expect(updatedA?.name).toEqual("Changed in A");
            expect(untouchedB?.name).toEqual("Isolation Group");

            await deleteGroup.execute({ group: groupA });

            const deletedA = await getGroup.execute({ tenant: TENANT_A, id: groupA.id });
            const remainingB = await getGroup.execute({ tenant: TENANT_B, id: groupB.id });
            expect(deletedA).toBeNull();
            expect(remainingB?.name).toEqual("Isolation Group");

            await deleteGroup.execute({ group: groupB });
        });
    });

    describe("entries", () => {
        it("should keep the same entry id apart across tenants", async () => {
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
            const id1 = createIdentifier({ id: ISOLATION_ENTRY_ID, version: 1 });
            const id2 = createIdentifier({ id: ISOLATION_ENTRY_ID, version: 2 });

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
             * Only `tenant` is checked for A2: DDB rewrites the latest revision with
             * un-converted values when a non-latest revision is updated (DdbUpdateEntry),
             * so A2's `values` are not reliable on DDB.
             */
            const a2AfterUpdate = await getRevisionById.execute(modelA, { id: id2 });
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
});
