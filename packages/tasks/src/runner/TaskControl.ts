import { ITaskEvent } from "~/handler/types";
import { Context, ITaskData, TaskDataStatus } from "~/types";
import { ITaskControl, ITaskRunner } from "./abstractions";
import { TaskManager } from "./TaskManager";
import { IResponse, IResponseErrorResult } from "~/response/abstractions";
import { DatabaseResponse } from "~/response";

export class TaskControl implements ITaskControl {
    public readonly runner: ITaskRunner;
    public readonly response: IResponse;
    public readonly context: Context;

    public constructor(runner: ITaskRunner, response: IResponse, context: Context) {
        this.runner = runner;
        this.context = context;
        this.response = response;
    }

    public async run(event: Pick<ITaskEvent, "webinyTaskId">) {
        const taskId = event.webinyTaskId;
        /**
         * This is the initial getTask idea.
         * We will need to take care of child tasks:
         * * child tasks can be in multiple levels (child task creates a child task, etc...).
         * * child tasks could be executed in parallel.
         */
        let task: ITaskData;
        try {
            task = await this.getTask(taskId);
        } catch (ex: unknown) {
            return ex as IResponseErrorResult;
        }
        /**
         * Make sure that task does not run if it is stopped.
         * This will effectively end the Step Function execution with a "success" status.
         */
        if (task.status === TaskDataStatus.STOPPED) {
            return this.response.stopped();
        }

        const databaseResponse = new DatabaseResponse(this.response, task, this.context);

        const taskDefinition = this.context.tasks.getDefinition(task.definitionId);
        if (!taskDefinition) {
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

        const manager = new TaskManager(
            this.runner,
            this.context,
            this.response,
            task,
            taskDefinition
        );

        try {
            const result = await manager.run();

            return await databaseResponse.from(result);
        } catch (ex) {
            return this.response.error({
                error: {
                    message: ex.message,
                    code: ex.code || "TASK_ERROR",
                    stack: ex.stack,
                    data: {
                        ...ex.data,
                        values: task.values
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
}
