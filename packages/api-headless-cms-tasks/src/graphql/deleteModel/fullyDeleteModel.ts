import type { HcmsTasksContext } from "~/types.js";
import type {
    IDeleteCmsModelTask,
    IDeleteModelTaskInput,
    IStoreValue
} from "~/features/DeleteModelTask/types.js";
import { createStoreKey, createStoreValue } from "~/helpers/store.js";
import { DELETE_MODEL_TASK } from "~/constants.js";
import { getStatus } from "~/graphql/deleteModel/status.js";
import { NotAuthorizedError } from "@webiny/api-headless-cms/utils/errors.js";

export interface IFullyDeleteModelParams {
    readonly context: Pick<HcmsTasksContext, "cms" | "tasks" | "db" | "security">;
    readonly modelId: string;
}

export const fullyDeleteModel = async (
    params: IFullyDeleteModelParams
): Promise<IDeleteCmsModelTask> => {
    const { context, modelId } = params;

    const model = await context.cms.getModel(modelId);
    if (!model) {
        throw new Error(`Model "${modelId}" not found.`);
    }

    if (model.isPrivate) {
        throw new Error(`Cannot delete private model.`);
    }

    const canAccessModel = await context.cms.accessControl.canAccessModel({ model, rwd: "d" });
    if (!canAccessModel) {
        throw new NotAuthorizedError(`Not allowed to access content model "${model.name}".`);
    }

    /**
     * Security: the task deletes every entry of the model, so the caller must be able to
     * delete entries and must not be limited to its own entries.
     */
    const canAccessEntry = await context.cms.accessControl.canAccessEntry({ model, rwd: "d" });
    const onlyOwnedEntries = await context.cms.accessControl.canAccessOnlyOwnedEntries({
        model
    });
    if (!canAccessEntry || onlyOwnedEntries) {
        throw new NotAuthorizedError(`Not allowed to delete "${model.modelId}" entries.`);
    }
    const storeKey = createStoreKey(model);
    const result = await context.db.store.getValue<IStoreValue>(storeKey);
    const taskId = result.data?.task;
    if (taskId) {
        throw new Error(`Model "${modelId}" is already getting deleted. Task id: ${taskId}.`);
    }

    const triggerResult = await context.tasks.trigger<IDeleteModelTaskInput>({
        input: {
            modelId
        },
        definition: DELETE_MODEL_TASK,
        name: `Fully delete model: ${modelId}`
    });

    const task = triggerResult.value;

    const identity = context.security.getIdentity();

    await context.db.store.storeValue(
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
