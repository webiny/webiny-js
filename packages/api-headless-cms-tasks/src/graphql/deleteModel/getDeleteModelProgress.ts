import type { HcmsTasksContext } from "~/types.js";
import { WebinyError } from "@webiny/error";
import { NotFoundError } from "@webiny/api-graphql";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type {
    IDeleteCmsModelTask,
    IDeleteModelTaskInput,
    IDeleteModelTaskOutput
} from "~/features/DeleteModelTask/types.js";
import { createDeleteModelStore } from "~/helpers/store.js";
import { DELETE_MODEL_TASK } from "~/constants.js";
import { getStatus } from "~/graphql/deleteModel/status.js";
import { NotAuthorizedError } from "@webiny/api-headless-cms/utils/errors.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api";

export interface IGetDeleteModelProgress {
    readonly context: Pick<HcmsTasksContext, "container">;
    readonly modelId: string;
}

export const getDeleteModelProgress = async (
    params: IGetDeleteModelProgress
): Promise<IDeleteCmsModelTask> => {
    const { context, modelId } = params;

    let model: CmsModel;
    try {
        const modelResult = await context.container.resolve(GetModelUseCase).execute(modelId);
        if (modelResult.isFail()) {
            throw modelResult.error;
        }
        model = modelResult.value;
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

    const accessControl = context.container.resolve(AccessControl);
    const canAccessModel = await accessControl.canAccessModel({ model, rwd: "d" });
    if (!canAccessModel) {
        throw new NotAuthorizedError(`Not allowed to access content model "${model.name}".`);
    }

    const canAccessEntry = await accessControl.canAccessEntry({ model, rwd: "w" });
    if (!canAccessEntry) {
        throw new NotAuthorizedError(`Not allowed to access "${model.modelId}" entries.`);
    }

    const store = createDeleteModelStore(
        context.container.resolve(GlobalKeyValueStore),
        model.tenant
    );
    const existing = await store.get(model.modelId);

    const taskId = existing?.task;
    if (!taskId) {
        throw new Error(`Model "${modelId}" is not being deleted.`);
    }

    const task = await context.container
        .resolve(GetTaskUseCase)
        .execute<IDeleteModelTaskInput, IDeleteModelTaskOutput>(taskId);
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
