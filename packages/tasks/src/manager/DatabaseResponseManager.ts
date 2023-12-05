import {
    Context,
    IResponseManager,
    IResponseManagerContinue,
    IResponseManagerContinueParams,
    IResponseManagerDone,
    IResponseManagerDoneParams,
    IResponseManagerError,
    IResponseManagerErrorParams,
    ITaskData,
    ITaskDataStatus
} from "~/types";
import { ResponseManager } from "~/manager/ResponseManager";
import { NotFoundError } from "@webiny/handler-graphql";

export class DatabaseResponseManager extends ResponseManager {
    private readonly response: IResponseManager;
    private readonly task: ITaskData;
    private readonly context: Context;

    public constructor(response: IResponseManager, task: ITaskData, context: Context) {
        super();
        this.response = response;
        this.task = task;
        this.context = context;
    }

    public async done(params: IResponseManagerDoneParams): Promise<IResponseManagerDone> {
        let message = params.message;
        try {
            await this.context.tasks.updateTask(this.task.id, {
                status: ITaskDataStatus.SUCCESS,
                log: (this.task.log || []).concat([
                    {
                        message: message || "Task done.",
                        createdOn: new Date().toISOString()
                    }
                ])
            });
        } catch (ex) {
            message = `Task done, but failed to update task log. (${ex.message || "unknown"})`;
        }
        /**
         * Default behavior is to return the done response.
         */
        return this.response.done({
            ...params,
            message
        });
    }

    public async continue<T = unknown>(
        params: IResponseManagerContinueParams<T>
    ): Promise<IResponseManagerContinue<T> | IResponseManagerError> {
        try {
            await this.context.tasks.updateTask(this.task.id, {
                input: params.input,
                status: ITaskDataStatus.RUNNING,
                log: (this.task.log || []).concat([
                    {
                        message: "Task continuing.",
                        createdOn: new Date().toISOString()
                    }
                ])
            });
        } catch (ex) {
            /**
             * If task was not found, we just return the error.
             */
            if (ex instanceof NotFoundError) {
                return this.response.error({
                    task: {
                        id: this.task.id
                    },
                    error: {
                        message: ex.message || `Task not found.`,
                        code: ex.code || "TASK_NOT_FOUND",
                        data: {
                            ...ex.data,
                            id: this.task.id
                        }
                    },
                    input: params.input
                });
            }
            /**
             * Otherwise, we store the error and return it...
             */
            return this.error({
                task: {
                    id: this.task.id
                },
                error: {
                    message: `Failed to update task input. (${ex.message || "unknown"})`,
                    code: ex.code || "TASK_UPDATE_ERROR",
                    data: {
                        id: this.task.id
                    }
                },
                input: params.input
            });
        }
        /**
         * Default behavior is to return the continue response.
         */
        return this.response.continue<T>(params);
    }

    public async error(params: IResponseManagerErrorParams): Promise<IResponseManagerError> {
        try {
            await this.context.tasks.updateTask(this.task.id, {
                savedOn: new Date(),
                status: ITaskDataStatus.FAILED,
                log: (this.task.log || []).concat([
                    {
                        message: params.error.message,
                        createdOn: new Date().toISOString()
                    }
                ])
            });
        } catch (ex) {
            return this.response.error({
                ...params,
                error: {
                    ...params.error,
                    message: ex.message || params.error.message,
                    code: ex.code || params.error.code,
                    data: {
                        ...params.error.data,
                        ...ex.data
                    }
                }
            });
        }
        /**
         * Default behavior is to return the error response.
         */
        return this.response.error(params);
    }
}
