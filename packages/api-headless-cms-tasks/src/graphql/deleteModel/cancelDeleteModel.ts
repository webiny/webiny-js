import type { HcmsTasksContext } from "~/types.js";
import { WebinyError } from "@webiny/error";
import type {
    IDeleteCmsModelTask,
    IDeleteModelTaskInput,
    IDeleteModelTaskOutput,
    IStoreValue
} from "~/features/DeleteModelTask/types.js";
import { createStoreKey } from "~/helpers/store.js";
import { DELETE_MODEL_TASK } from "~/constants.js";
import { getStatus } from "~/graphql/deleteModel/status.js";
import { NotAuthorizedError } from "@webiny/api-headless-cms/utils/errors.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { DbInstance } from "@webiny/handler-db/abstractions.js";
import { GetTaskUseCase, AbortTaskUseCase } from "@webiny/background-tasks/api";

export interface ICancelDeleteModelParams {
    readonly context: Pick<HcmsTasksContext, "cms" | "container">;
    readonly modelId: string;
}

export const cancelDeleteModel = async (
    params: ICancelDeleteModelParams
): Promise<IDeleteCmsModelTask> => {
    const { context, modelId } = params;

    const model = await context.cms.getModel(modelId);
    const accessControl = context.container.resolve(AccessControl);

    const canAccessModel = await accessControl.canAccessModel({ model, rwd: "d" });
    if (!canAccessModel) {
        throw new NotAuthorizedError(`Not allowed to access content model "${model.name}".`);
    }

    const canAccessEntry = await accessControl.canAccessEntry({ model, rwd: "w" });
    if (!canAccessEntry) {
        throw new NotAuthorizedError(`Not allowed to access "${model.modelId}" entries.`);
    }

    const storeKey = createStoreKey(model);

    const db = context.container.resolve(DbInstance);
    const result = await db.store.getValue<IStoreValue>(storeKey);

    const taskId = result.data?.task;

    await db.store.removeValue(storeKey);
    if (!taskId) {
        if (result.error) {
            throw WebinyError.from(result.error, {
                code: "DELETE_MODEL_NO_TASK_DEFINED"
            });
        }
        throw new WebinyError({
            message: `Model "${modelId}" is not being deleted.`,
            code: "MODEL_NOT_BEING_DELETED"
        });
    }

    const task = await context.container
        .resolve(GetTaskUseCase)
        .execute<IDeleteModelTaskInput, IDeleteModelTaskOutput>(taskId);
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

    const abortResult = await context.container
        .resolve(AbortTaskUseCase)
        .execute<IDeleteModelTaskInput, IDeleteModelTaskOutput>({
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
