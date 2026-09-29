import { describe, expect, it, vi } from "vitest";
import { CreateModelStorageOperation } from "~/features/shared/storageOperations/model/CreateModelStorageOperation.js";
import { GetModelStorageOperation } from "~/features/shared/storageOperations/model/GetModelStorageOperation.js";
import { UpdateModelStorageOperation } from "~/features/shared/storageOperations/model/UpdateModelStorageOperation.js";
import { DeleteModelStorageOperation } from "~/features/shared/storageOperations/model/DeleteModelStorageOperation.js";
import { ListModelsStorageOperation } from "~/features/shared/storageOperations/model/ListModelsStorageOperation.js";
import {
    createIsolationModel,
    ISOLATION_MODEL_ID,
    TENANT_A,
    TENANT_B,
    useStorageContainer
} from "./helpers";

vi.setConfig({
    testTimeout: 100_000
});

describe("Tenant isolation - models", () => {
    const getContainer = useStorageContainer();

    it("should update and delete only the tenant's model", async () => {
        const container = getContainer();
        const createModel = container.resolve(CreateModelStorageOperation);
        const getModel = container.resolve(GetModelStorageOperation);
        const updateModel = container.resolve(UpdateModelStorageOperation);
        const deleteModel = container.resolve(DeleteModelStorageOperation);

        const modelA = createIsolationModel(TENANT_A);
        const modelB = createIsolationModel(TENANT_B);
        await createModel.execute({ model: modelA });
        await createModel.execute({ model: modelB });

        await updateModel.execute({ model: { ...modelA, name: "Changed in A" } });

        const updatedA = await getModel.execute({ tenant: TENANT_A, modelId: ISOLATION_MODEL_ID });
        const untouchedB = await getModel.execute({
            tenant: TENANT_B,
            modelId: ISOLATION_MODEL_ID
        });
        expect(updatedA?.name).toEqual("Changed in A");
        expect(untouchedB?.name).toEqual("Isolation Model");

        await deleteModel.execute({ model: modelA });

        const deletedA = await getModel.execute({ tenant: TENANT_A, modelId: ISOLATION_MODEL_ID });
        const remainingB = await getModel.execute({
            tenant: TENANT_B,
            modelId: ISOLATION_MODEL_ID
        });
        expect(deletedA).toBeNull();
        expect(remainingB?.name).toEqual("Isolation Model");
    });

    it("should list only the tenant's models", async () => {
        const container = getContainer();
        const createModel = container.resolve(CreateModelStorageOperation);
        const listModels = container.resolve(ListModelsStorageOperation);

        await createModel.execute({ model: createIsolationModel(TENANT_A) });
        await createModel.execute({ model: createIsolationModel(TENANT_B) });

        const models = await listModels.execute({ where: { tenant: TENANT_A } });
        const isolationModels = models.filter(model => model.modelId === ISOLATION_MODEL_ID);
        expect(isolationModels).toHaveLength(1);
        expect(models.every(model => model.tenant === TENANT_A)).toBe(true);
    });
});
