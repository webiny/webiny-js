import { ITaskEvent } from "~/handler/types";
import {
    Context,
    ITask,
    ITaskDataInput,
    ITaskDefinition,
    ITaskLog,
    TaskDataStatus,
    TaskResponseStatus
} from "~/types";
import { ITaskControl, ITaskRunner } from "./abstractions";
import { TaskManager } from "./TaskManager";
import { IResponse, IResponseResult } from "~/response/abstractions";
import { DatabaseResponse, TaskResponse } from "~/response";
import { TaskManagerStore } from "./TaskManagerStore";
import { NotFoundError } from "@webiny/handler-graphql";
import { getErrorProperties } from "~/utils/getErrorProperties";

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
            this.context.security.setIdentity(task.createdBy);
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
        const disableDatabaseLogs = !!definition.disableDatabaseLogs;

        /**
         * As this as a run of the task, we need to create a new log entry.
         */
        let taskLog: ITaskLog;
        try {
            taskLog = await this.getTaskLog(task, disableDatabaseLogs);
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

        const taskResponse = new TaskResponse(this.response);
        const store = new TaskManagerStore({
            context: this.context,
            task,
            log: taskLog,
            disableDatabaseLogs
        });

        const manager = new TaskManager(
            this.runner,
            this.context,
            this.response,
            taskResponse,
            store
        );

        const databaseResponse = new DatabaseResponse(this.response, store);

        try {
            const result = await manager.run(definition);

            await this.runEvents(result, definition, task);

            return await databaseResponse.from(result);
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
        }
    }

    private async runEvents(
        result: IResponseResult,
        definition: ITaskDefinition,
        task: ITask
    ): Promise<void> {
        if (result.status === TaskResponseStatus.ERROR && definition.onError) {
            try {
                await definition.onError({
                    task,
                    context: this.context
                });
            } catch (ex) {
                console.error(`Error executing onError hook for task "${task.id}".`);
                console.log(getErrorProperties(ex));
            }
        } else if (result.status === TaskResponseStatus.DONE && definition.onDone) {
            try {
                await definition.onDone({
                    task,
                    context: this.context
                });
            } catch (ex) {
                console.error(`Error executing onDone hook for task "${task.id}".`);
                console.log(getErrorProperties(ex));
            }
        }
    }

    private async getTask<T = any>(id: string): Promise<ITask<T>> {
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

    private async getTaskLog(task: ITask, disableDatabaseLogs: boolean): Promise<ITaskLog> {
        /**
         * If logs are disabled, let's return a mocked one.
         */
        if (disableDatabaseLogs) {
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
            if (error instanceof NotFoundError === false) {
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
