import type { ITaskManager, ITaskManagerStorePrivate } from "./abstractions/index.js";
import type { Context } from "~/types.js";
import { TaskDataStatus } from "~/types.js";
import type { IResponse, IResponseResult } from "~/response/abstractions/index.js";
import { getErrorProperties } from "~/utils/getErrorProperties.js";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/abstractions.js";

export class TaskManager implements ITaskManager {
    private readonly context: Context;
    private readonly response: IResponse;
    private readonly store: ITaskManagerStorePrivate;

    public constructor(context: Context, response: IResponse, store: ITaskManagerStorePrivate) {
        this.context = context;
        this.response = response;
        this.store = store;
    }

    public async run(definition: TaskDefinition.Runnable): Promise<IResponseResult> {
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
                await this.store.save();
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
                        task: this.store.getTask()
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

        let result: TaskDefinition.Result;

        try {
            const input = structuredClone(this.store.getInput());
            const controller = this.context.container.resolve(TaskController);
            /**
             * We always run the task without authorization because we are running a task without a user - nothing to authorize against.
             */
            result = await this.context.security.withoutAuthorization(async () => {
                return await definition.run({
                    input,
                    controller
                });
            });
        } catch (ex) {
            return this.response.error({
                error: getErrorProperties(ex)
            });
        }

        // Convert TaskDefinition.Result to IResponseResult
        if (result.status === TaskResultStatus.CONTINUE) {
            return this.response.continue({
                input: result.input,
                wait: result.wait
            });
        } else if (result.status === TaskResultStatus.ERROR) {
            return this.response.error({
                error: result.error || { message: result.message }
            });
        } else if (result.status === TaskResultStatus.ABORTED) {
            return this.response.aborted();
        }
        return this.response.done({
            message: result.message,
            output: result.output
        });
    }
}
