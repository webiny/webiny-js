import { TaskDataStatus, TaskResponseStatus } from "~/types";
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
import { ITaskManagerStore } from "~/runner/abstractions";

export class DatabaseResponse implements IResponseAsync {
    public readonly response: IResponse;

    private readonly store: ITaskManagerStore;

    public constructor(response: IResponse, store: ITaskManagerStore) {
        this.response = response;
        this.store = store;
    }

    public from(result: IResponseResult): Promise<IResponseResult> {
        switch (result.status) {
            case TaskResponseStatus.DONE:
                return this.done(result);
            case TaskResponseStatus.CONTINUE:
                return this.continue(result);
            case TaskResponseStatus.ERROR:
                return this.error(result);
            case TaskResponseStatus.ABORTED:
                return this.aborted();
        }
    }

    public async done(params: IResponseDoneParams): Promise<IResponseDoneResult> {
        let message = params.message;
        try {
            const task = this.store.getTask();
            await this.store.updateTask({
                taskStatus: TaskDataStatus.SUCCESS,
                finishedOn: new Date().toISOString(),
                log: task.log.concat([
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

    public async aborted() {
        return this.response.aborted();
    }

    public async continue(
        params: IResponseContinueParams
    ): Promise<IResponseContinueResult | IResponseErrorResult> {
        try {
            const task = this.store.getTask();
            await this.store.updateTask({
                values: {
                    ...task.values,
                    ...params.values
                },
                taskStatus: TaskDataStatus.RUNNING,
                log: task.log.concat([
                    {
                        message: "Task continuing.",
                        createdOn: new Date().toISOString(),
                        values: params.values
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
                            values: this.store.getValues()
                        }
                    }
                });
            }
            /**
             * Otherwise, we store the error and return it...
             */
            return this.error({
                error: {
                    message: `Failed to update task values: ${ex.message || "unknown error"}`,
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
            const task = this.store.getTask();
            await this.store.updateTask({
                taskStatus: TaskDataStatus.FAILED,
                finishedOn: new Date().toISOString(),
                log: task.log.concat([
                    {
                        message: params.error.message,
                        createdOn: new Date().toISOString(),
                        values: this.store.getValues()
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
                        values: this.store.getValues()
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
                    values: this.store.getValues()
                }
            }
        });
    }
}
