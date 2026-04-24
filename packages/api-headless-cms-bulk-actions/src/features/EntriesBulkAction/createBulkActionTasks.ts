import { createFeature } from "@webiny/feature/api";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { BulkActionContext } from "~/features/BulkActionContext/index.js";
import type {
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput,
    IBulkActionOperationInput,
    IBulkActionOperationOutput
} from "~/types.js";
import { EntriesBulkAction, EntriesBulkActionConfig } from "./abstractions.js";
import { BulkActionName } from "~/domain/BulkActionName.js";
import { ChildTasksCleanup } from "./internals/ChildTasksCleanup.js";
import { ProcessTask } from "./internals/ProcessTask.js";
import { CreateTasksByModel } from "./internals/CreateTasksByModel.js";
import { ProcessTasksByModel } from "./internals/ProcessTasksByModel.js";

enum BulkActionOperationByModelAction {
    CREATE_SUBTASKS = "CREATE_SUBTASKS",
    CHECK_MORE_SUBTASKS = "CHECK_MORE_SUBTASKS",
    PROCESS_SUBTASKS = "PROCESS_SUBTASKS",
    END_TASK = "END_TASK"
}

export const createBulkActionTasks = (
    bulkAction: EntriesBulkAction.Interface,
    bulkActionsConfig: EntriesBulkActionConfig.Interface
) => {
    const bulkActionName = BulkActionName.from(bulkAction.name);
    const batchSize = bulkAction.batchSize ?? bulkActionsConfig.batchSize ?? 100;
    const listTaskId = `hcmsBulkList${bulkActionName}Entries`;
    const processTaskId = `hcmsBulkProcess${bulkActionName}Entries`;

    // List Task - manages pagination and creates subtasks
    class BulkActionListTask implements TaskDefinition.Interface<
        IBulkActionOperationByModelInput,
        IBulkActionOperationByModelOutput
    > {
        public readonly id = listTaskId;
        public readonly title = `Headless CMS: list "${bulkActionName}" entries by model`;
        public readonly maxIterations = 500;
        public readonly databaseLogs = false;
        public readonly isPrivate = true;
        public readonly context: BulkActionContext.Interface;
        public readonly getModel: GetModelUseCase.Interface;

        constructor(context: BulkActionContext.Interface, getModel: GetModelUseCase.Interface) {
            this.context = context;
            this.getModel = getModel;
        }

        async run({
            input,
            controller
        }: TaskDefinition.RunParams<
            IBulkActionOperationByModelInput,
            IBulkActionOperationByModelOutput
        >) {
            try {
                if (!input.modelId) {
                    return controller.response.error(`Missing "modelId" in the input.`);
                }

                const action = input.action ?? BulkActionOperationByModelAction.CREATE_SUBTASKS;

                switch (action) {
                    case BulkActionOperationByModelAction.PROCESS_SUBTASKS: {
                        const processTasks = new ProcessTasksByModel(this.context, processTaskId);
                        return await processTasks.execute({ input, controller });
                    }
                    case BulkActionOperationByModelAction.CREATE_SUBTASKS:
                    case BulkActionOperationByModelAction.CHECK_MORE_SUBTASKS: {
                        const createTasks = new CreateTasksByModel(
                            this.context,
                            this.getModel,
                            bulkAction,
                            processTaskId,
                            batchSize
                        );
                        return await createTasks.execute({ input, controller });
                    }
                    case BulkActionOperationByModelAction.END_TASK: {
                        return controller.response.done(
                            `Task done: task "${processTaskId}" has been successfully processed for entries from "${
                                input.modelId
                            }" model.`
                        );
                    }
                    default:
                        return controller.response.error(`Unknown action: ${action}`);
                }
            } catch (ex) {
                return controller.response.error(ex.message ?? "Error while executing list task");
            }
        }

        async onDone({ task }: TaskDefinition.LifecycleHookParams): Promise<void> {
            await this.cleanup(task);
        }

        async onError({ task }: TaskDefinition.LifecycleHookParams) {
            await this.cleanup(task);
        }

        async onAbort({ task }: TaskDefinition.LifecycleHookParams) {
            await this.cleanup(task);
        }

        async onMaxIterations({ task }: TaskDefinition.LifecycleHookParams) {
            await this.cleanup(task);
        }

        async cleanup(task: TaskDefinition.Task) {
            const childTasksCleanup = new ChildTasksCleanup();
            try {
                await childTasksCleanup.execute({ context: this.context, task });
            } catch (ex) {
                console.error(`Error while cleaning "${listTaskId}" child tasks.`, ex);
            }
        }
    }

    // Process Task - processes individual batches of entries
    class BulkActionProcessTask implements TaskDefinition.Interface<
        IBulkActionOperationInput,
        IBulkActionOperationOutput
    > {
        public readonly id = processTaskId;
        public readonly title = `Headless CMS: process "${bulkActionName}" entries`;
        public readonly maxIterations = 2;
        public readonly databaseLogs = false;
        public readonly isPrivate = true;
        public readonly getModel: GetModelUseCase.Interface;

        constructor(getModel: GetModelUseCase.Interface) {
            this.getModel = getModel;
        }

        async run({
            input,
            controller
        }: TaskDefinition.RunParams<IBulkActionOperationInput, IBulkActionOperationOutput>) {
            try {
                const processTask = new ProcessTask(bulkAction, this.getModel);
                return await processTask.execute({ input, controller });
            } catch (ex) {
                return controller.response.error(
                    ex.message ?? "Error while executing process task"
                );
            }
        }
    }

    const BulkListTask = TaskDefinition.createImplementation({
        implementation: BulkActionListTask,
        dependencies: [BulkActionContext, GetModelUseCase]
    });

    const BulkProcessTask = TaskDefinition.createImplementation({
        implementation: BulkActionProcessTask,
        dependencies: [GetModelUseCase]
    });

    return createFeature({
        name: `HeadlessCms/BulkActionTasks/${bulkActionName}`,
        register(container) {
            container.register(BulkListTask);
            container.register(BulkProcessTask);
        }
    });
};
