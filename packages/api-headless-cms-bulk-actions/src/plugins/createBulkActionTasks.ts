import { createPrivateTaskDefinition, ITask } from "@webiny/tasks";
import { IListEntries, IProcessEntry } from "~/abstractions";
import {
    ChildTasksCleanup,
    CreateTasksByModel,
    ProcessTask,
    ProcessTasksByModel
} from "~/useCases/internals";
import {
    BulkActionOperationByModelAction,
    HcmsBulkActionsContext,
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput,
    IBulkActionOperationInput,
    IBulkActionOperationOutput
} from "~/types";

export interface CreateBackgroundTasksConfig {
    name: string;
    dataLoader: (context: HcmsBulkActionsContext) => IListEntries;
    dataProcessor: (context: HcmsBulkActionsContext) => IProcessEntry;
    batchSize?: number;
}

const BATCH_SIZE = 100; // Default number of entries to fetch in each batch

class BulkActionTasks {
    private readonly name: string;
    private readonly dataLoader: (context: HcmsBulkActionsContext) => IListEntries;
    private readonly dataProcessor: (context: HcmsBulkActionsContext) => IProcessEntry;
    private readonly batchSize: number;

    constructor(config: CreateBackgroundTasksConfig) {
        this.name = config.name;
        this.dataLoader = config.dataLoader;
        this.dataProcessor = config.dataProcessor;
        this.batchSize = config.batchSize || BATCH_SIZE;
    }

    public createListTaskDefinition() {
        return createPrivateTaskDefinition<
            HcmsBulkActionsContext,
            IBulkActionOperationByModelInput,
            IBulkActionOperationByModelOutput
        >({
            id: this.createListTaskDefinitionName(),
            title: `Headless CMS: list "${this.name}" entries by model`,
            maxIterations: 500,
            disableDatabaseLogs: true,
            run: async params => {
                const { response, input, context } = params;

                try {
                    if (!input.modelId) {
                        return response.error(`Missing "modelId" in the input.`);
                    }

                    const action = this.getCurrentAction(input);

                    switch (action) {
                        case BulkActionOperationByModelAction.PROCESS_SUBTASKS: {
                            const processTasks = new ProcessTasksByModel(
                                this.createProcessTaskDefinitionName()
                            );
                            return await processTasks.execute(params);
                        }
                        case BulkActionOperationByModelAction.CREATE_SUBTASKS:
                        case BulkActionOperationByModelAction.CHECK_MORE_SUBTASKS: {
                            const createTasks = new CreateTasksByModel(
                                this.createProcessTaskDefinitionName(),
                                this.dataLoader(context),
                                this.batchSize
                            );
                            return await createTasks.execute(params);
                        }
                        case BulkActionOperationByModelAction.END_TASK: {
                            return response.done(
                                `Task done: task "${this.createProcessTaskDefinitionName()}" has been successfully processed for entries from "${
                                    input.modelId
                                }" model.`
                            );
                        }
                        default:
                            return response.error(`Unknown action: ${action}`);
                    }
                } catch (ex) {
                    return response.error(ex.message ?? "Error while executing list task");
                }
            },
            onDone: async ({ context, task }) => {
                await this.onCreateListTaskDefinitionFinish(context, task, "done");
            },
            onError: async ({ context, task }) => {
                await this.onCreateListTaskDefinitionFinish(context, task, "error");
            },
            onAbort: async ({ context, task }) => {
                await this.onCreateListTaskDefinitionFinish(context, task, "abort");
            },
            onMaxIterations: async ({ context, task }) => {
                await this.onCreateListTaskDefinitionFinish(context, task, "maxIterations");
            }
        });
    }

    public createProcessTaskDefinition() {
        return createPrivateTaskDefinition<
            HcmsBulkActionsContext,
            IBulkActionOperationInput,
            IBulkActionOperationOutput
        >({
            id: this.createProcessTaskDefinitionName(),
            title: `Headless CMS: process "${this.name}" entries`,
            maxIterations: 2,
            disableDatabaseLogs: true,
            run: async params => {
                const { response, context } = params;

                try {
                    const processTask = new ProcessTask(this.dataProcessor(context));
                    return await processTask.execute(params);
                } catch (ex) {
                    return response.error(ex.message ?? "Error while executing process task");
                }
            }
        });
    }

    private createListTaskDefinitionName() {
        return `hcmsBulkList${this.name}Entries`;
    }

    private createProcessTaskDefinitionName() {
        return `hcmsBulkProcess${this.name}Entries`;
    }

    private getCurrentAction(input: IBulkActionOperationByModelInput) {
        return input.action ?? BulkActionOperationByModelAction.CREATE_SUBTASKS;
    }

    private async onCreateListTaskDefinitionFinish(
        context: HcmsBulkActionsContext,
        task: ITask,
        cause: string
    ) {
        /**
         * We want to clean all child tasks and logs, which have no errors.
         */
        const childTasksCleanup = new ChildTasksCleanup();
        try {
            await childTasksCleanup.execute({
                context,
                task
            });
        } catch (ex) {
            console.error(
                `Error while cleaning "${this.createListTaskDefinitionName()} child tasks - ${cause}."`,
                ex
            );
        }
    }
}

export const createBulkActionTasks = (config: CreateBackgroundTasksConfig) => {
    const backgroundTasks = new BulkActionTasks(config);

    return [
        backgroundTasks.createListTaskDefinition(),
        backgroundTasks.createProcessTaskDefinition()
    ];
};
