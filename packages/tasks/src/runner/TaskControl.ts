import { ITaskEvent } from "~/handler/types";
import { Context, ITaskData, ITaskDataInput, ITaskLog, TaskDataStatus } from "~/types";
import { ITaskControl, ITaskRunner } from "./abstractions";
import { TaskManager } from "./TaskManager";
import { IResponse, IResponseErrorResult, IResponseResult } from "~/response/abstractions";
import { DatabaseResponse, TaskResponse } from "~/response";
import { TaskManagerStore } from "./TaskManagerStore";
import { NotFoundError } from "@webiny/handler-graphql";
import { getObjectProperties } from "~/runner/utils/getObjectProperties";

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
        let task: ITaskData<ITaskDataInput>;
        try {
            task = await this.getTask(taskId);
        } catch (ex) {
            return getObjectProperties<IResponseErrorResult>(ex);
        }
        /**
         * As this as a run of the task, we need to create a new log entry.
         */

        let taskLog: ITaskLog;
        try {
            taskLog = await this.getTaskLog(task);
        } catch (ex) {
            return getObjectProperties<IResponseErrorResult>(ex);
        }
        /**
         * Make sure that task does not run if it is aborted.
         * This will effectively end the Step Function execution with a "success" status.
         */
        if (task.taskStatus === TaskDataStatus.ABORTED) {
            return this.response.aborted();
        }

        const taskResponse = new TaskResponse(this.response);
        const store = new TaskManagerStore(this.context, task, taskLog);

        const manager = new TaskManager(
            this.runner,
            this.context,
            this.response,
            taskResponse,
            store
        );

        const databaseResponse = new DatabaseResponse(this.response, store);

        const definition = this.context.tasks.getDefinition(task.definitionId);
        if (!definition) {
            return await databaseResponse.error({
                error: {
                    message: `Task "${task.id}" cannot be executed because there is no "${task.definitionId}" definition plugin.`,
                    code: "TASK_DEFINITION_ERROR",
                    data: {
                        definitionId: task.definitionId
                    }
                }
            });
        }

        try {
            const result = await manager.run(definition);

            return await databaseResponse.from(result);
        } catch (ex) {
            return this.response.error({
                error: {
                    message: ex.message,
                    code: ex.code || "TASK_ERROR",
                    stack: ex.stack,
                    data: {
                        ...ex.data,
                        input: task.input
                    }
                }
            });
        }
    }

    private async getTask<T = any>(id: string): Promise<ITaskData<T>> {
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

    private async getTaskLog(task: ITaskData): Promise<ITaskLog> {
        let taskLog: ITaskLog | null = null;
        /**
         * First we are trying to get existing latest log.
         */
        try {
            taskLog = await this.context.tasks.getLatestLog(task.id);
        } catch (ex) {
            /**
             * If error is not the NotFoundError, we need to throw it.
             */
            if (ex instanceof NotFoundError === false) {
                throw this.response.error({
                    error: getObjectProperties(ex)
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
        } catch (ex) {
            throw this.response.error({
                error: getObjectProperties(ex)
            });
        }
    }
}
