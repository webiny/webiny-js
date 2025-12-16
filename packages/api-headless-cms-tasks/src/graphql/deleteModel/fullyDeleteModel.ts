import type { HcmsTasksContext } from "~/types.js";
import type {
    IDeleteCmsModelTask,
    IDeleteModelTaskInput,
    IStoreValue
} from "~/features/DeleteModelTask/types.js";
import { createStoreKey, createStoreValue } from "~/helpers/store.js";
import { DELETE_MODEL_TASK } from "~/constants.js";
import { getStatus } from "~/graphql/deleteModel/status.js";

export interface IFullyDeleteModelParams {
    readonly context: Pick<HcmsTasksContext, "cms" | "tasks" | "db" | "security">;
    readonly modelId: string;
}

export const fullyDeleteModel = async (
    params: IFullyDeleteModelParams
): Promise<IDeleteCmsModelTask> => {
    const { context, modelId } = params;

    const model = await context.cms.getModel(modelId);

    if (model.isPrivate) {
        throw new Error(`Cannot delete private model.`);
    }

    await context.cms.accessControl.ensureCanAccessModel({
        model,
        rwd: "d"
    });

    await context.cms.accessControl.ensureCanAccessEntry({
        model,
        rwd: "w"
    });

    if (!model) {
        throw new Error(`Model "${modelId}" not found.`);
    }
    const storeKey = createStoreKey(model);
    const result = await context.db.store.getValue<IStoreValue>(storeKey);
    const taskId = result.data?.task;
    if (taskId) {
        throw new Error(`Model "${modelId}" is already getting deleted. Task id: ${taskId}.`);
    }

    const task = await context.tasks.trigger<IDeleteModelTaskInput>({
        input: {
            modelId
        },
        definition: DELETE_MODEL_TASK,
        name: `Fully delete model: ${modelId}`
    });

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
