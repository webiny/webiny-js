import type { HcmsTasksContext } from "~/types.js";
import { WebinyError } from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
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

export interface IGetDeleteModelProgress {
    readonly context: Pick<HcmsTasksContext, "cms" | "tasks" | "db">;
    readonly modelId: string;
}

export const getDeleteModelProgress = async (
    params: IGetDeleteModelProgress
): Promise<IDeleteCmsModelTask> => {
    const { context, modelId } = params;

    let model: CmsModel;
    try {
        model = await context.cms.getModel(modelId);
    } catch (ex) {
        if (ex instanceof NotFoundError === false) {
            throw ex;
        }
        throw new WebinyError({
            message: "Model not found. It must have been deleted already.",
            code: "MODEL_ALREADY_DELETED_FOUND",
            data: {
                model: modelId
            }
        });
    }

    const canAccessModel = await context.cms.accessControl.canAccessModel({ model, rwd: "d" });
    if (!canAccessModel) {
        throw new NotAuthorizedError(`Not allowed to access content model "${model.name}".`);
    }

    const canAccessEntry = await context.cms.accessControl.canAccessEntry({ model, rwd: "w" });
    if (!canAccessEntry) {
        throw new NotAuthorizedError(`Not allowed to access "${model.modelId}" entries.`);
    }

    const storeKey = createStoreKey(model);
    const result = await context.db.store.getValue<IStoreValue>(storeKey);

    const taskId = result.data?.task;
    if (!taskId) {
        throw new Error(`Model "${modelId}" is not being deleted.`);
    }

    const task = await context.tasks.getTask<IDeleteModelTaskInput, IDeleteModelTaskOutput>(taskId);
    if (task?.definitionId !== DELETE_MODEL_TASK) {
        throw new WebinyError({
            message: `The task which is deleting a model cannot be found.`,
            code: "DELETE_MODEL_TASK_NOT_FOUND",
            data: {
                model: model.modelId,
                task: taskId
            }
        });
    }
    return {
        id: task.id,
        status: getStatus(task.taskStatus),
        total: task.output?.total || 0,
        deleted: task.output?.deleted || 0
    };
};
