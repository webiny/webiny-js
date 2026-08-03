import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListTasksUseCase, TriggerTaskUseCase, TasksCrud } from "@webiny/background-tasks/api";
import type {
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput,
    IBulkActionOperationInput,
    IBulkActionOperationOutput
} from "~/types.js";
import { BulkActionOperationByModelAction } from "~/types.js";
import { EntriesBulkAction, EntriesBulkActionConfig } from "./abstractions.js";
import { BulkActionName } from "~/domain/BulkActionName.js";
import { ChildTasksCleanup } from "./internals/ChildTasksCleanup.js";
import { ProcessTask } from "./internals/ProcessTask.js";
import { CreateTasksByModel } from "./internals/CreateTasksByModel.js";
import { ProcessTasksByModel } from "./internals/ProcessTasksByModel.js";
import type { Container } from "@webiny/di";

export const BULK_ACTION_LIST_TASK_ID = "hcmsBulkListEntries";
export const BULK_ACTION_PROCESS_TASK_ID = "hcmsBulkProcessEntries";

const resolveBulkAction = (container: Container, actionName: string) => {
    const bulkActions = container.resolveAll(EntriesBulkAction);
    const action = bulkActions.find(a => BulkActionName.from(a.name) === actionName);
    if (!action) {
        throw new Error(`Unknown bulk action: "${actionName}"`);
    }
    return action;
};

class BulkActionListTask
    implements TaskDefinition.Interface<IBulkActionOperationByModelInput, IBulkActionOperationByModelOutput>
{
    public readonly id = BULK_ACTION_LIST_TASK_ID;
    public readonly title = "Headless CMS: list entries for bulk action";
    public readonly maxIterations = 500;
    public readonly databaseLogs = false;
    public readonly isPrivate = true;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    constructor(
        private readonly container: Container,
        private readonly getModel: GetModelUseCase.Interface,
        private readonly listTasks: ListTasksUseCase.Interface,
        private readonly triggerTask: TriggerTaskUseCase.Interface,
        private readonly tasksCrud: TasksCrud.Interface,
        private readonly bulkActionsConfig: EntriesBulkActionConfig.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IBulkActionOperationByModelInput, IBulkActionOperationByModelOutput>) {
        try {
            if (!input.modelId) {
                return controller.response.error(`Missing "modelId" in the input.`);
            }
            if (!input.actionName) {
                return controller.response.error(`Missing "actionName" in the input.`);
            }

            const bulkAction = resolveBulkAction(this.container, input.actionName);
            const batchSize = bulkAction.batchSize ?? this.bulkActionsConfig.batchSize ?? 100;
            const action = input.action ?? BulkActionOperationByModelAction.CREATE_SUBTASKS;

            switch (action) {
                case BulkActionOperationByModelAction.PROCESS_SUBTASKS: {
                    const processTasks = new ProcessTasksByModel(
                        this.listTasks,
                        BULK_ACTION_PROCESS_TASK_ID
                    );
                    return await processTasks.execute({ input, controller });
                }
                case BulkActionOperationByModelAction.CREATE_SUBTASKS:
                case BulkActionOperationByModelAction.CHECK_MORE_SUBTASKS: {
                    const createTasks = new CreateTasksByModel(
                        this.getModel,
                        this.triggerTask,
                        bulkAction,
                        BULK_ACTION_PROCESS_TASK_ID,
                        batchSize
                    );
                    return await createTasks.execute({ input, controller });
                }
                case BulkActionOperationByModelAction.END_TASK: {
                    return controller.response.done(
                        `Task done: bulk action "${input.actionName}" has been successfully processed for entries from "${input.modelId}" model.`
                    );
                }
                default:
                    return controller.response.error(`Unknown action: ${action}`);
            }
        } catch (ex) {
            return controller.response.error(
                ex.message ?? "Error while executing bulk action list task"
            );
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
            await childTasksCleanup.execute({ tasksCrud: this.tasksCrud, task });
        } catch (ex) {
            console.error(`Error while cleaning bulk action list child tasks.`, ex);
        }
    }
}

class BulkActionProcessTask
    implements TaskDefinition.Interface<IBulkActionOperationInput, IBulkActionOperationOutput>
{
    public readonly id = BULK_ACTION_PROCESS_TASK_ID;
    public readonly title = "Headless CMS: process entries for bulk action";
    public readonly maxIterations = 2;
    public readonly databaseLogs = false;
    public readonly isPrivate = true;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    constructor(
        private readonly container: Container,
        private readonly getModel: GetModelUseCase.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IBulkActionOperationInput, IBulkActionOperationOutput>) {
        try {
            if (!input.actionName) {
                return controller.response.error(`Missing "actionName" in the input.`);
            }

            const bulkAction = resolveBulkAction(this.container, input.actionName);
            const processTask = new ProcessTask(bulkAction, this.getModel);
            return await processTask.execute({ input, controller });
        } catch (ex) {
            return controller.response.error(
                ex.message ?? "Error while executing bulk action process task"
            );
        }
    }
}

import { RequestContainer } from "@webiny/event-handler-core";

export const BulkActionListTaskDefinition = TaskDefinition.createImplementation({
    implementation: BulkActionListTask,
    dependencies: [
        RequestContainer,
        GetModelUseCase,
        ListTasksUseCase,
        TriggerTaskUseCase,
        TasksCrud,
        EntriesBulkActionConfig
    ]
});

export const BulkActionProcessTaskDefinition = TaskDefinition.createImplementation({
    implementation: BulkActionProcessTask,
    dependencies: [RequestContainer, GetModelUseCase]
});
