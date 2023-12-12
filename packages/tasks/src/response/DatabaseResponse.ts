import { Context, ITaskData, TaskDataStatus, TaskResponseStatus } from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    IResponse,
    IResponseAsync,
    IResponseContinueParams,
    IResponseContinueResult,
    IResponseDoneParams,
    IResponseDoneResult,
    IResponseErrorParams,
    IResponseErrorResult,
    IResponseResult
} from "./abstractions";

export class DatabaseResponse implements IResponseAsync {
    public readonly response: IResponse;

    private readonly task: ITaskData;
    private readonly context: Context;

    public constructor(response: IResponse, task: ITaskData, context: Context) {
        this.response = response;
        this.task = task;
        this.context = context;
    }

    public from(result: IResponseResult): Promise<IResponseResult> {
        switch (result.status) {
            case TaskResponseStatus.DONE:
                return this.done(result);
            case TaskResponseStatus.CONTINUE:
                return this.continue(result);
            case TaskResponseStatus.ERROR:
                return this.error(result);
        }
    }

    public async done(params: IResponseDoneParams): Promise<IResponseDoneResult> {
        let message = params.message;
        try {
            await this.context.tasks.updateTask(this.task.id, {
                status: TaskDataStatus.SUCCESS,
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

    public async continue(
        params: IResponseContinueParams
    ): Promise<IResponseContinueResult | IResponseErrorResult> {
        try {
            await this.context.tasks.updateTask(this.task.id, {
                input: params.input,
                status: TaskDataStatus.RUNNING,
                log: (this.task.log || []).concat([
                    {
                        message: "Task continuing.",
                        createdOn: new Date().toISOString(),
                        input: params.input
                    }
                ])
            });
        } catch (ex) {
            /**
             * If task was not found, we just return the error.
             */
            if (ex instanceof NotFoundError) {
                return this.response.error({
                    error: {
                        message: ex.message || `Task not found.`,
                        code: ex.code || "TASK_NOT_FOUND",
                        data: {
                            ...ex.data,
                            input: this.task.input
                        }
                    }
                });
            }
            /**
             * Otherwise, we store the error and return it...
             */
            return this.error({
                error: {
                    message: `Failed to update task input: ${ex.message || "unknown error"}`,
                    code: ex.code || "TASK_UPDATE_ERROR"
                }
            });
        }
        /**
         * Default behavior is to return the continue response.
         */
        return this.response.continue(params);
    }

    public async error(params: IResponseErrorParams): Promise<IResponseErrorResult> {
        try {
            await this.context.tasks.updateTask(this.task.id, {
                savedOn: new Date(),
                status: TaskDataStatus.FAILED,
                log: (this.task.log || []).concat([
                    {
                        message: params.error.message,
                        createdOn: new Date().toISOString(),
                        input: this.task.input
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
                        ...ex.data,
                        input: this.task.input
                    }
                }
            });
        }
        /**
         * Default behavior is to return the error response.
         */
        return this.response.error({
            ...params,
            error: {
                ...params.error,
                data: {
                    ...params.error.data,
                    input: this.task.input
                }
            }
        });
    }
}
