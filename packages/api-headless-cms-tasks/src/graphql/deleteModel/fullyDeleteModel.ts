import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type {
    IDeleteCmsModelTask,
    IDeleteModelTaskInput
} from "~/features/DeleteModelTask/types.js";
import { createDeleteModelStore, createStoreValue } from "~/helpers/store.js";
import { DELETE_MODEL_TASK } from "~/constants.js";
import { getStatus } from "~/graphql/deleteModel/status.js";
import { assertModelDeletable } from "~/graphql/deleteModel/assertModelDeletable.js";
import type { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import type { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import type { TriggerTaskUseCase } from "@webiny/background-tasks/api";

export interface IFullyDeleteModelParams {
    readonly getModel: GetModelUseCase.Interface;
    readonly accessControl: AccessControl.Interface;
    readonly keyValueStore: GlobalKeyValueStore.Interface;
    readonly triggerTask: TriggerTaskUseCase.Interface;
    readonly identityContext: IdentityContext.Interface;
    readonly modelId: string;
}

export const fullyDeleteModel = async (
    params: IFullyDeleteModelParams
): Promise<IDeleteCmsModelTask> => {
    const { getModel, accessControl, keyValueStore, triggerTask, identityContext, modelId } =
        params;

    const modelResult = await getModel.execute(modelId);
    if (modelResult.isFail()) {
        throw modelResult.error;
    }
    const model = modelResult.value;

    if (model.isPrivate) {
        throw new Error(`Cannot delete private model.`);
    }

    await assertModelDeletable({ accessControl, model });

    const store = createDeleteModelStore(keyValueStore, model.tenant);
    const existing = await store.get(model.modelId);
    if (existing?.task) {
        throw new Error(
            `Model "${modelId}" is already getting deleted. Task id: ${existing.task}.`
        );
    }

    const triggerResult = await triggerTask.execute<IDeleteModelTaskInput>({
        input: {
            modelId
        },
        definition: DELETE_MODEL_TASK,
        name: `Fully delete model: ${modelId}`
    });

    const task = triggerResult.value;

    const identity = identityContext.getIdentity();

    await store.set(
        createStoreValue({
            ...model,
            identity: {
                id: identity.id,
                type: identity.type,
                displayName: identity.displayName
            },
            task: task.id
        })
    );

    return {
        id: task.id,
        status: getStatus(task.taskStatus),
        total: 0,
        deleted: 0
    };
};
