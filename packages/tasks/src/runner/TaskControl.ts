import type { ITaskEvent } from "~/handler/types.js";
import type { Context, ITask, ITaskDataInput, ITaskLog } from "~/types.js";
import { TaskDataStatus } from "~/types.js";
import type { ITaskControl, ITaskRunner } from "./abstractions/index.js";
import { TaskManager } from "./TaskManager.js";
import type { IResponse, IResponseResult } from "~/response/abstractions/index.js";
import { DatabaseResponse, TaskResponse } from "~/response/index.js";
import { TaskManagerStore } from "./TaskManagerStore.js";
import { getErrorProperties } from "~/utils/getErrorProperties.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TaskExecutionContext } from "~/features/TaskExecutionContext/index.js";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

interface IGetTaskLogParams {
    task: ITask;
    databaseLogs: boolean;
}

export class TaskControl implements ITaskControl {
    public readonly runner: ITaskRunner;
    public readonly response: IResponse;
    public readonly context: Context;

    public constructor(runner: ITaskRunner, response: IResponse, context: Context) {
        this.runner = runner;
        this.context = context;
        this.response = response;
    }

    public async run(event: Pick<ITaskEvent, "webinyTaskId">): Promise<IResponseResult> {
        const taskId = event.webinyTaskId;
        /**
         * This is the initial getTask idea.
         * We will need to take care of child tasks:
         * * child tasks can be in multiple levels (child task creates a child task, etc...).
         * * child tasks could be executed in parallel.
         */
        let task: ITask<ITaskDataInput>;
        try {
            task = await this.getTask(taskId);
            this.context.security.setIdentity(
                new AuthenticatedIdentity({
                    id: task.createdBy.id,
                    type: task.createdBy.type,
                    displayName: task.createdBy.displayName ?? "",
                    context: {
                        canAccessTenant: true
                    }
                })
            );
        } catch (error) {
            /**
             * TODO Refactor error handling.
             */
            // @ts-expect-error
            return this.response.error({
                ...getErrorProperties(error)
            });
        }
        /**
         * Let's get the task definition.
         */
        const definition = this.context.tasks.getDefinition(task.definitionId);
        if (!definition) {
            return this.response.error({
                error: {
                    message: `Task "${task.id}" cannot be executed because there is no "${task.definitionId}" definition plugin.`,
                    code: "TASK_DEFINITION_ERROR",
                    data: {
                        definitionId: task.definitionId
                    }
                }
            });
        }
        /**
         * Only enable logs if definition explicitly allows them.
         */
        const databaseLogs = definition.databaseLogs === true;

        /**
         * As this as a run of the task, we need to create a new log entry.
         */
        let taskLog: ITaskLog;
        try {
            taskLog = await this.getTaskLog({
                task,
                databaseLogs
            });
        } catch (error) {
            return this.response.error({
                error
            });
        }
        /**
         * Make sure that task does not run if it is aborted.
         * This will effectively end the Step Function execution with a "success" status.
         */
        if (task.taskStatus === TaskDataStatus.ABORTED) {
            return this.response.aborted();
        }
        /**
         * Do not run if already a success (done).
         */
        //
        else if (task.taskStatus === TaskDataStatus.SUCCESS) {
            return this.response.error({
                error: {
                    message: "Task is already done, cannot run it again."
                }
            });
        }
        /**
         * Do not run if already failed.
         */
        //
        else if (task.taskStatus === TaskDataStatus.FAILED) {
            return this.response.error({
                error: {
                    message: "Task has failed, cannot run it again."
                }
            });
        }

        const store = new TaskManagerStore({
            context: this.context,
            task,
            log: taskLog,
            databaseLogs
        });

        // Populate TaskExecutionContext BEFORE executing task
        const executionContext = this.context.container.resolve(TaskExecutionContext);
        executionContext.setStore(store);
        executionContext.setRunner(this.runner);
        executionContext.setTimer(this.runner.timer);
        executionContext.setResponse(new TaskResponse(this.response));

        const manager = new TaskManager(this.context, this.response, store);

        const databaseResponse = new DatabaseResponse(this.response, store);

        try {
            const result = await manager.run(definition);

            const responseResult = await databaseResponse.from(result);

            // Get the updated task from store (no database read needed - store maintains local cache)
            await this.runEvents(result, definition, store.getTask());

            return responseResult;
        } catch (ex) {
            /**
             * We always want to store the error in the task log.
             */
            return await databaseResponse.from(
                this.response.error({
                    error: {
                        message: ex.message,
                        code: ex.code || "TASK_ERROR",
                        stack: ex.stack,
                        data: {
                            ...ex.data,
                            input: task.input
                        }
                    }
                })
            );
        } finally {
            // Clear execution context after task completes
            executionContext.clear();
        }
    }

    private async runEvents(
        result: IResponseResult,
        definition: TaskDefinition.Runnable,
        task: ITask
    ): Promise<void> {
        if (result.status === TaskResultStatus.ERROR && definition.onError) {
            try {
                await definition.onError({ task });
            } catch (ex) {
                console.error(`Error executing onError hook for task "${task.id}".`);
                console.log(getErrorProperties(ex));
            }
        } else if (result.status === TaskResultStatus.DONE && definition.onDone) {
            try {
                await definition.onDone({ task });
            } catch (ex) {
                console.error(`Error executing onDone hook for task "${task.id}".`);
                console.log(getErrorProperties(ex));
            }
        }
    }

    private async getTask<T extends TaskDefinition.TaskInput>(id: string): Promise<ITask<T>> {
        try {
            const task = await this.runner.context.tasks.getTask<T>(id);
            if (task) {
                return task;
            }
        } catch (ex) {
            throw this.response.error({
                error: {
                    message: ex.message,
                    code: ex.code || "TASK_ERROR",
                    stack: ex.stack,
                    data: ex.data
                }
            });
        }
        throw this.response.error({
            error: {
                message: `Task "${id}" cannot be executed because it does not exist.`,
                code: "TASK_NOT_FOUND"
            }
        });
    }

    private async getTaskLog(params: IGetTaskLogParams): Promise<ITaskLog> {
        const { task, databaseLogs } = params;
        /**
         * If logs are disabled, let's return a mocked one.
         */
        if (!databaseLogs) {
            return {
                id: `${task.id}-log`,
                createdOn: task.createdOn,
                createdBy: task.createdBy,
                executionName: task.executionName,
                task: task.id,
                iteration: task.iterations,
                items: []
            };
        }
        let taskLog: ITaskLog | null = null;
        /**
         * First we are trying to get existing latest log.
         */
        try {
            taskLog = await this.context.tasks.getLatestLog(task.id);
        } catch (error) {
            /**
             * If error is not the NotFoundError, we need to throw it.
             */
            if (error.code !== "NOT_FOUND") {
                throw this.response.error({
                    error
                });
            }
            /**
             * Otherwise just continue and create a new log.
             */
        }

        const currentIteration = taskLog?.iteration || 0;

        try {
            return await this.context.tasks.createLog(task, {
                executionName: this.response.event.executionName,
                iteration: currentIteration + 1
            });
        } catch (error) {
            throw this.response.error({
                error
            });
        }
    }
}
