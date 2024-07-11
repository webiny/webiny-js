import { createPrivateTaskDefinition } from "@webiny/tasks";
import { IListEntries, IProcessEntry } from "~/abstractions";
import {
    ChildTasksCleanup,
    CreateTasksByModel,
    ProcessTask,
    ProcessTasksByModel
} from "~/useCases/internals";
import {
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
}

class BulkActionTasks {
    private readonly name: string;
    private readonly dataLoader: (context: HcmsBulkActionsContext) => IListEntries;
    private readonly dataProcessor: (context: HcmsBulkActionsContext) => IProcessEntry;

    constructor(config: CreateBackgroundTasksConfig) {
        this.name = config.name;
        this.dataLoader = config.dataLoader;
        this.dataProcessor = config.dataProcessor;
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
            run: async params => {
                const { response, input, context } = params;

                try {
                    if (!input.modelId) {
                        return response.error(`Missing "modelId" in the input.`);
                    }

                    if (input.processing) {
                        const processTasks = new ProcessTasksByModel(
                            this.createProcessTaskDefinitionName()
                        );
                        return await processTasks.execute(params);
                    }

                    const createTasks = new CreateTasksByModel(
                        this.createProcessTaskDefinitionName(),
                        this.dataLoader(context)
                    );
                    return await createTasks.execute(params);
                } catch (ex) {
                    return response.error(ex.message ?? "Error while executing list task");
                }
            },
            onDone: async ({ context, task }) => {
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
                    console.error("Error while cleaning list child tasks.", ex);
                }
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
            run: async params => {
                const { response, context } = params;

                try {
                    const processTask = new ProcessTask(this.dataProcessor(context));
                    return await processTask.execute(params);
                } catch (ex) {
                    return response.error(ex.message ?? "Error while executing process task");
                }
            },
            onDone: async ({ context, task }) => {
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
                    console.error("Error while cleaning process child tasks.", ex);
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
}

export const createBulkActionTasks = (config: CreateBackgroundTasksConfig) => {
    const backgroundTasks = new BulkActionTasks(config);

    return [
        backgroundTasks.createListTaskDefinition(),
        backgroundTasks.createProcessTaskDefinition()
    ];
};
