import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsGroup, CmsModel } from "~/types";
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
});
