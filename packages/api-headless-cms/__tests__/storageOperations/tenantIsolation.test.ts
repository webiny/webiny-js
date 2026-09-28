import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsModel } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { createPersonModel } from "./helpers";
import { CreateModelStorageOperation } from "~/features/shared/storageOperations/model/CreateModelStorageOperation.js";
import { GetModelStorageOperation } from "~/features/shared/storageOperations/model/GetModelStorageOperation.js";
import { UpdateModelStorageOperation } from "~/features/shared/storageOperations/model/UpdateModelStorageOperation.js";
import { DeleteModelStorageOperation } from "~/features/shared/storageOperations/model/DeleteModelStorageOperation.js";

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
});
