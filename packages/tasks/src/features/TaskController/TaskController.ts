import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/abstractions.js";
import { TaskController as Abstraction } from "@webiny/api-core/features/task/TaskController/abstractions.js";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskExecutionContext } from "../TaskExecutionContext/abstractions.js";
import { type ITask, type ITaskTriggerParams, TaskDataStatus } from "~/types.js";
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

    response = {
        done: ((messageOrOutput?: string | any, output?: any) => {
            // If first arg is not a string, treat it as output
            if (typeof messageOrOutput !== "string" && typeof messageOrOutput !== "undefined") {
                return {
                    status: TaskResultStatus.DONE,
                    output: messageOrOutput
                } as const;
            }

            // Otherwise treat first arg as message
            return {
                status: TaskResultStatus.DONE,
                message: messageOrOutput,
                output
            } as const;
        }) as {
            (output?: any): any;
            (message?: string, output?: any): any;
        },

        continue: (input: any, options?: { wait?: number; message?: string }) =>
            ({
                status: TaskResultStatus.CONTINUE,
                message: options?.message,
                input,
                wait: options?.wait
            }) as const,

        error: (message: string, error?: Error | any) =>
            ({
                status: TaskResultStatus.ERROR,
                message,
                error:
                    error instanceof Error ? { message: error.message, stack: error.stack } : error
            }) as const,

        aborted: (message?: string) =>
            ({
                status: TaskResultStatus.ABORTED,
                message
            }) as const
    };

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
        trigger: async <CI extends TaskDefinition.TaskDataInput = TaskDefinition.TaskDataInput>(
            params: ITaskTriggerParams<CI>
        ): Promise<ITask<CI>> => {
            return this.taskService.trigger({ ...params, parent: this.store.getTask() });
        },
        listChildren: async <
            CT extends TaskDefinition.TaskDataInput = TaskDefinition.TaskDataInput,
            CO extends TaskDefinition.TaskDoneOutput = TaskDefinition.TaskDoneOutput
        >(
            definitionId?: string
        ): Promise<ITask<CT, CO>[]> => {
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
