import { ITaskEvent } from "~/handler/types";
import { Context, ITaskData, ITaskDefinition } from "~/types";
import { ITaskControl, ITaskRunner } from "./abstractions";
import { TaskPlugin } from "~/task/plugin";
import { TaskManager } from "./TaskManager";
import { IResponse, IResponseErrorResult } from "~/response/abstractions";
import WebinyError from "@webiny/error";
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
        let taskData: ITaskData;
        try {
            taskData = await this.getTask(taskId);
        } catch (ex: unknown) {
            return ex as IResponseErrorResult;
        }

        const databaseResponse = new DatabaseResponse(this.response, taskData, this.context);

        let taskDefinition: ITaskDefinition;
        try {
            taskDefinition = this.getTaskDefinition(taskData);
        } catch (ex) {
            return await databaseResponse.error({
                error: ex
            });
        }

        const manager = new TaskManager(
            this.runner,
            this.context,
            this.response,
            taskData,
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
                        input: taskData.input
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

    private getTaskDefinition(task: Pick<ITaskData, "id" | "input">): ITaskDefinition {
        const plugin = this.context.plugins.byType<TaskPlugin>(TaskPlugin.type).find(plugin => {
            return plugin.getTask().id === task.id;
        });
        if (!plugin) {
            throw new WebinyError({
                message: `Task "${task.id}" cannot be executed because there is no plugin defining the task.`,
                code: "TASK_DEFINITION_ERROR"
            });
        }
        return plugin.getTask();
    }
}
