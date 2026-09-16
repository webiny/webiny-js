import type { ITaskEvent } from "~/api/handler/types.js";
import type { Context, ITask, ITaskDataInput, ITaskLog } from "~/api/types.js";
import { TaskDataStatus } from "~/api/types.js";
import type { ITaskControl, ITaskRunner } from "./abstractions/index.js";
import { TaskManager } from "./TaskManager.js";
import type { IResponse, IResponseResult } from "~/api/response/abstractions/index.js";
import { DatabaseResponse, TaskResponse } from "~/api/response/index.js";
import { TaskManagerStore } from "./TaskManagerStore.js";
import { getErrorProperties } from "~/api/utils/getErrorProperties.js";
import {
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TaskExecutionContext } from "~/api/features/TaskExecutionContext/index.js";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TasksCrud } from "~/api/TasksCrud.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/abstractions.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/abstractions.js";

interface IGetTaskLogParams {
    task: ITask;
    databaseLogs: boolean;
}

/**
 * What TaskControl needs from the container, declared in one place.
 *
 * TaskControl is built by hand (TaskRunner does it), so it cannot take these through DI the way a
 * registered class would. Naming them here is the next best thing: the class states what it uses,
 * TaskRunner resolves them once where it assembles the object, and a test can pass fakes. Reaching
 * into `context.container` from inside a method instead would leave the class with dependencies
 * nothing can see or substitute.
 */
export interface ITaskControlDependencies {
    logger: Logger.Interface;
    identityContext: IdentityContext.Interface;
    taskExecutionContext: TaskExecutionContext.Interface;
    tasksCrud: TasksCrud.Interface;
    taskController: TaskController.Interface;
    getRunnableTaskDefinition: GetRunnableTaskDefinitionUseCase.Interface;
}

export class TaskControl implements ITaskControl {
    public readonly runner: ITaskRunner;
    public readonly response: IResponse;
    public readonly context: Context;
    private readonly deps: ITaskControlDependencies;

    public constructor(
        runner: ITaskRunner,
        response: IResponse,
        context: Context,
        deps: ITaskControlDependencies
    ) {
        this.runner = runner;
        this.context = context;
        this.response = response;
        this.deps = deps;
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
            this.deps.identityContext.setIdentity(
                new AuthenticatedIdentity({
                    id: task.createdBy.id,
                    type: task.createdBy.type,
                    displayName: task.createdBy.displayName || "",
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
        const definitionResult = this.deps.getRunnableTaskDefinition.execute(task.definitionId);
        if (definitionResult.isFail()) {
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
        const definition = definitionResult.value;
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
            tasksCrud: this.deps.tasksCrud,
            task,
            log: taskLog,
            databaseLogs
        });

        // Populate TaskExecutionContext BEFORE executing task
        const executionContext = this.deps.taskExecutionContext;
        executionContext.setStore(store);
        executionContext.setRunner(this.runner);
        executionContext.setTimer(this.runner.timer);
        executionContext.setResponse(new TaskResponse(this.response));

        const manager = new TaskManager(this.context, this.response, store, {
            taskController: this.deps.taskController,
            identityContext: this.deps.identityContext
        });

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
                await definition.onError({ task, definition });
            } catch (ex) {
                this.deps.logger.error(
                    { error: getErrorProperties(ex), taskId: task.id, hook: "onError" },
                    "Error executing task lifecycle hook."
                );
            }
        } else if (result.status === TaskResultStatus.DONE && definition.onDone) {
            try {
                await definition.onDone({ task, definition });
            } catch (ex) {
                this.deps.logger.error(
                    { error: getErrorProperties(ex), taskId: task.id, hook: "onDone" },
                    "Error executing task lifecycle hook."
                );
            }
        }
    }

    private async getTask<T extends TaskDefinition.TaskInput>(id: string): Promise<ITask<T>> {
        try {
            const task = await this.deps.tasksCrud.getTask<T>(id);
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
            taskLog = await this.deps.tasksCrud.getLatestLog(task.id);
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
            return await this.deps.tasksCrud.createLog(task, {
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
