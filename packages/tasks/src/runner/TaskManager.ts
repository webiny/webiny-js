import { ITaskManager, ITaskRunner } from "./abstractions";
import {
    Context,
    ITask,
    ITaskDataInput,
    ITaskDefinition,
    ITaskTriggerParams,
    TaskDataStatus,
    TaskResponseStatus
} from "~/types";
import {
    IResponse,
    IResponseResult,
    ITaskResponse,
    ITaskResponseResult
} from "~/response/abstractions";
import { ITaskManagerStore } from "~/runner/abstractions";
import { getErrorProperties } from "~/utils/getErrorProperties";

export class TaskManager<T = ITaskDataInput> implements ITaskManager<T> {
    private readonly runner: Pick<ITaskRunner, "isCloseToTimeout">;
    private readonly context: Context;
    private readonly response: IResponse;
    private readonly taskResponse: ITaskResponse;
    private readonly store: ITaskManagerStore;

    public constructor(
        runner: Pick<ITaskRunner, "isCloseToTimeout">,
        context: Context,
        response: IResponse,
        taskResponse: ITaskResponse,
        store: ITaskManagerStore
    ) {
        this.runner = runner;
        this.context = context;
        this.response = response;
        this.taskResponse = taskResponse;
        this.store = store;
    }

    public async run(definition: ITaskDefinition): Promise<IResponseResult> {
        /**
         * If task was aborted, do not run it again, return as it was done.
         */
        if (this.store.getStatus() === TaskDataStatus.ABORTED) {
            return this.response.aborted();
        }
        /**
         * If the task status is pending, update it to running and add a log.
         */
        //
        else if (this.store.getStatus() === TaskDataStatus.PENDING) {
            try {
                await this.store.updateTask({
                    taskStatus: TaskDataStatus.RUNNING,
                    startedOn: new Date().toISOString(),
                    executionName: this.response.event.executionName,
                    iterations: 1
                });
                await this.store.addInfoLog({
                    message: "Task started."
                });
            } catch (error) {
                return this.response.error({
                    error
                });
            }
        }
        /**
         * We do not want to run the task indefinitely.
         * If the task has reached the max iterations, we will stop it and execute the onMaxIterations handler, if any.
         */
        //
        else if (this.store.getTask().iterations >= definition.maxIterations) {
            try {
                if (definition.onMaxIterations) {
                    await definition.onMaxIterations({
                        task: this.store.getTask(),
                        context: this.context
                    });
                }
                return this.response.error({
                    error: {
                        message: "Task reached max iterations."
                    }
                });
            } catch (ex) {
                return this.response.error({
                    error: {
                        message: "Failed to execute onMaxIterations handler.",
                        data: getErrorProperties(ex)
                    }
                });
            }
        }
        /**
         * Always update the task iteration.
         */
        //
        else {
            try {
                await this.store.updateTask(task => {
                    return {
                        iterations: task.iterations + 1
                    };
                });
            } catch (error) {
                return this.response.error({
                    error
                });
            }
        }

        let result: ITaskResponseResult;

        try {
            const input = structuredClone(this.store.getInput());
            /**
             * We always run the task without authorization because we are running a task without a user - nothing to authorize against.
             */
            result = await this.context.security.withoutAuthorization(async () => {
                return await definition.run({
                    input,
                    context: this.context,
                    response: this.taskResponse,
                    isCloseToTimeout: (seconds?: number) => {
                        return this.runner.isCloseToTimeout(seconds);
                    },
                    isAborted: () => {
                        return this.store.getStatus() === TaskDataStatus.ABORTED;
                    },
                    store: this.store,
                    trigger: async <I = ITaskDataInput>(
                        params: Omit<ITaskTriggerParams<I>, "parent">
                    ): Promise<ITask<I>> => {
                        return this.context.tasks.trigger({
                            ...params,
                            parent: this.store.getTask()
                        });
                    }
                });
            });
        } catch (ex) {
            return this.response.error({
                error: getErrorProperties(ex)
            });
        }

        if (result.status === TaskResponseStatus.CONTINUE) {
            return this.response.continue({
                input: result.input,
                wait: result.wait
            });
        } else if (result.status === TaskResponseStatus.ERROR) {
            return this.response.error({
                error: result.error
            });
        } else if (result.status === TaskResponseStatus.ABORTED) {
            return this.response.aborted();
        }
        return this.response.done({
            message: result.message,
            output: result.output
        });
    }
}
