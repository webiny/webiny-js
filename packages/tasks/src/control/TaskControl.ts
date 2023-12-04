import { ITaskEvent } from "~/handler/types";
import { ITaskRunner } from "~/runner/types";
import { Context, IResponseManager, ITaskData, ITaskDefinition } from "~/types";
import { ITaskControl, ITaskControlParams } from "./types";
import { TaskPlugin } from "~/task/plugin";
import { TaskRunErrorResponse, TaskRunResponse } from "~/manager/response";
import { TaskManager } from "~/manager";
import { DatabaseResponseManager } from "~/manager/DatabaseResponseManager";

export class TaskControl implements ITaskControl {
    public readonly runner: ITaskRunner;
    public readonly response: IResponseManager;
    public readonly context: Context;

    public constructor(params: ITaskControlParams) {
        this.runner = params.runner;
        this.context = params.context;
        this.response = params.response;
    }

    public async run(event: ITaskEvent) {
        const taskId = event.webinyTaskId;

        const taskData = await this.getTask(taskId);
        if (taskData instanceof TaskRunResponse) {
            return taskData;
        }

        const databaseResponse = new DatabaseResponseManager(this.response, taskData);

        const taskDefinition = this.getTaskDefinition(taskData);
        if (taskDefinition instanceof TaskRunResponse) {
            return databaseResponse.from(taskDefinition);
        }

        const manager = new TaskManager({
            runner: this.runner,
            context: this.context,
            response: databaseResponse,
            task: taskData,
            definition: taskDefinition
        });

        try {
            return await manager.run();
        } catch (ex) {
            return this.response.error({
                task: {
                    id: taskId
                },
                error: {
                    message: ex.message,
                    code: ex.code || "TASK_ERROR",
                    stack: ex.stack,
                    data: {
                        ...ex.data,
                        id: taskId
                    }
                },
                input: taskData.input
            });
        }
    }

    private async getTask<T = any>(id: string): Promise<ITaskData<T> | TaskRunErrorResponse> {
        try {
            const task = await this.runner.context.tasks.getTask<T>(id);
            if (task) {
                return task;
            }
            return this.response.error({
                task: {
                    id
                },
                error: {
                    message: `Task "${id}" cannot be executed because it does not exist.`,
                    code: "TASK_NOT_FOUND"
                },
                input: {}
            });
        } catch (ex) {
            return this.response.error({
                task: {
                    id
                },
                error: {
                    message: ex.message,
                    code: ex.code || "TASK_ERROR",
                    stack: ex.stack,
                    data: {
                        ...ex.data,
                        id
                    }
                },
                input: {}
            });
        }
    }

    private getTaskDefinition(
        task: Pick<ITaskData<any>, "id" | "input">
    ): ITaskDefinition | TaskRunErrorResponse {
        const plugin = this.runner.context.plugins
            .byType<TaskPlugin>(TaskPlugin.type)
            .find(plugin => {
                return plugin.getTask().id === task.id;
            });
        if (!plugin) {
            return this.response.error({
                task: {
                    id: task.id
                },
                error: {
                    message: `Task "${task.id}" cannot be executed because there is no plugin defining the task.`,
                    code: "TASK_DEFINITION_ERROR"
                },
                input: task.input
            });
        }
        return plugin.getTask();
    }
}
