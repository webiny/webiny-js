import { WebinyError } from "@webiny/error";
import type {
    IDeleteCmsModelTask,
    IDeleteModelTaskInput,
    IDeleteModelTaskOutput
} from "~/features/DeleteModelTask/types.js";
import { createDeleteModelStore } from "~/helpers/store.js";
import { DELETE_MODEL_TASK } from "~/constants.js";
import { getStatus } from "~/graphql/deleteModel/status.js";
import { assertModelDeletable } from "~/graphql/deleteModel/assertModelDeletable.js";
import type { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import type { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import type { GetTaskUseCase, AbortTaskUseCase } from "@webiny/background-tasks/api";

export interface ICancelDeleteModelParams {
    readonly getModel: GetModelUseCase.Interface;
    readonly accessControl: AccessControl.Interface;
    readonly keyValueStore: GlobalKeyValueStore.Interface;
    readonly getTask: GetTaskUseCase.Interface;
    readonly abortTask: AbortTaskUseCase.Interface;
    readonly modelId: string;
}

export const cancelDeleteModel = async (
    params: ICancelDeleteModelParams
): Promise<IDeleteCmsModelTask> => {
    const { getModel, accessControl, keyValueStore, getTask, abortTask, modelId } = params;

    const modelResult = await getModel.execute(modelId);
    if (modelResult.isFail()) {
        throw modelResult.error;
    }
    const model = modelResult.value;

    await assertModelDeletable({ accessControl, model });

    const store = createDeleteModelStore(keyValueStore, model.tenant);
    const existing = await store.get(model.modelId);
    const taskId = existing?.task;

    await store.remove(model.modelId);
    if (!taskId) {
        throw new WebinyError({
            message: `Model "${modelId}" is not being deleted.`,
            code: "MODEL_NOT_BEING_DELETED"
        });
    }

    const task = await getTask.execute<IDeleteModelTaskInput, IDeleteModelTaskOutput>(taskId);
    if (task?.definitionId !== DELETE_MODEL_TASK) {
        throw new WebinyError({
            message: `The task which is deleting a model cannot be found. Please check Step Functions for more info. Task id: ${taskId}`,
            code: "DELETE_MODEL_TASK_NOT_FOUND",
            data: {
                model: model.modelId,
                task: taskId
            }
        });
    }

    const abortResult = await abortTask.execute<IDeleteModelTaskInput, IDeleteModelTaskOutput>({
        id: task.id,
        message: "User canceled the task."
    });

    const canceledTask = abortResult.value;

    return {
        id: canceledTask.id,
        status: getStatus(canceledTask.taskStatus),
        total: canceledTask.output?.total || 0,
        deleted: canceledTask.output?.deleted || 0
    };
};
