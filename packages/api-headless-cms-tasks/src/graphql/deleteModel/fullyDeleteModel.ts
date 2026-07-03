import type { HcmsTasksContext } from "~/types.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type {
    IDeleteCmsModelTask,
    IDeleteModelTaskInput,
    IStoreValue
} from "~/features/DeleteModelTask/types.js";
import { createStoreKey, createStoreValue } from "~/helpers/store.js";
import { DELETE_MODEL_TASK } from "~/constants.js";
import { getStatus } from "~/graphql/deleteModel/status.js";
import { NotAuthorizedError } from "@webiny/api-headless-cms/utils/errors.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { DbInstance } from "@webiny/handler-db/abstractions.js";
import { TriggerTaskUseCase } from "@webiny/background-tasks/api";

export interface IFullyDeleteModelParams {
    readonly context: Pick<HcmsTasksContext, "container">;
    readonly modelId: string;
}

export const fullyDeleteModel = async (
    params: IFullyDeleteModelParams
): Promise<IDeleteCmsModelTask> => {
    const { context, modelId } = params;

    const modelResult = await context.container.resolve(GetModelUseCase).execute(modelId);
    if (modelResult.isFail()) {
        throw modelResult.error;
    }
    const model = modelResult.value;

    if (model.isPrivate) {
        throw new Error(`Cannot delete private model.`);
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

    if (!model) {
        throw new Error(`Model "${modelId}" not found.`);
    }
    const storeKey = createStoreKey(model);
    const db = context.container.resolve(DbInstance);
    const result = await db.store.getValue<IStoreValue>(storeKey);
    const taskId = result.data?.task;
    if (taskId) {
        throw new Error(`Model "${modelId}" is already getting deleted. Task id: ${taskId}.`);
    }

    const triggerResult = await context.container
        .resolve(TriggerTaskUseCase)
        .execute<IDeleteModelTaskInput>({
            input: {
                modelId
            },
            definition: DELETE_MODEL_TASK,
            name: `Fully delete model: ${modelId}`
        });

    const task = triggerResult.value;

    const identity = context.container.resolve(IdentityContext).getIdentity();

    await db.store.storeValue(
        storeKey,
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
