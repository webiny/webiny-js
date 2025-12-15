import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/abstractions.js";
import { TaskController as Abstraction } from "@webiny/api-core/features/task/TaskController/abstractions.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskExecutionContext } from "../TaskExecutionContext/abstractions.js";
import { type ITaskTriggerParams, TaskDataStatus } from "~/types.js";
import "./augmentation.js";

class TaskControllerImpl implements Abstraction.Interface {
    constructor(
        private taskService: TaskService.Interface,
        private executionContext: TaskExecutionContext.Interface
    ) {}

    private get store() {
        return this.executionContext.store;
    }

    private get runner() {
        return this.executionContext.runner;
    }

    private get timer() {
        return this.executionContext.timer;
    }

    public get response() {
        return this.executionContext.response;
    }

    state = {
        getTask: () => this.store.getTask(),
        getStatus: () => this.store.getStatus(),
        getInput: () => this.store.getInput(),
        getOutput: () => this.store.getOutput(),
        updateInput: async (input: any) => await this.store.updateInput(input),
        updateOutput: async (output: any) => await this.store.updateOutput(output)
    };

    logger = {
        info: async (params: { message: string; data?: Record<string, any> }) => {
            await this.store.addInfoLog(params);
        },
        error: async (params: {
            message: string;
            error?: Error | any;
            data?: Record<string, any>;
        }) => {
            const error = params.error;
            const errorObj =
                error instanceof Error ? { message: error.message, stack: error.stack } : error;
            await this.store.addErrorLog({
                message: params.message,
                error: errorObj,
                data: params.data
            });
        }
    };

    task = {
        trigger: async <CI extends TaskDefinition.TaskInput = TaskDefinition.TaskInput>(
            params: ITaskTriggerParams<CI>
        ): Promise<TaskService.Task<CI>> => {
            return this.taskService.trigger({ ...params, parent: this.store.getTask() });
        },
        listChildren: async <
            CT extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
            CO extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
        >(
            definitionId?: string
        ): Promise<TaskService.Task<CT, CO>[]> => {
            return this.store.listChildTasks(definitionId);
        }
    };

    runtime = {
        isCloseToTimeout: (seconds?: number) => this.runner.isCloseToTimeout(seconds),
        isAborted: () => this.store.getStatus() === TaskDataStatus.ABORTED,
        getRemainingSeconds: () => this.timer.getRemainingSeconds(),
        getRemainingMilliseconds: () => this.timer.getRemainingMilliseconds()
    };
}

export const TaskController = Abstraction.createImplementation({
    implementation: TaskControllerImpl,
    dependencies: [TaskService, TaskExecutionContext]
});
