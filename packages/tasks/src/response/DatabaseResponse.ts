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
import { ITaskManagerStorePrivate } from "~/runner/abstractions";
import { getErrorProperties } from "~/utils/getErrorProperties";

export class DatabaseResponse implements IResponseAsync {
    public readonly response: IResponse;

    private readonly store: ITaskManagerStorePrivate;

    public constructor(response: IResponse, store: ITaskManagerStorePrivate) {
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
        const { output, ...rest } = params;
        let message = params.message;
        try {
            await this.store.updateTask({
                taskStatus: TaskDataStatus.SUCCESS,
                finishedOn: new Date().toISOString(),
                output
            });
            await this.store.addInfoLog({
                message: message || "Task done."
            });
            await this.store.save();
        } catch (ex) {
            message = `Task done, but failed to update task log. (${ex.message || "unknown"})`;
        }
        /**
         * Default behavior is to return the done response.
         */
        return this.response.done({
            ...rest,
            message,
            output
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
                input: {
                    ...task.input,
                    ...params.input
                },
                taskStatus: TaskDataStatus.RUNNING
            });
            await this.store.addInfoLog({
                message: "Task continuing.",
                data: params.input
            });
            await this.store.save();
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
                            input: this.store.getInput()
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
        const error =
            params.error instanceof Error ? getErrorProperties(params.error) : params.error;
        try {
            await this.store.updateTask({
                taskStatus: TaskDataStatus.FAILED,
                finishedOn: new Date().toISOString(),
                output: {
                    error
                }
            });
            await this.store.addErrorLog({
                message: params.error.message,
                data: this.store.getInput(),
                error
            });
            await this.store.save();
        } catch (ex) {
            return this.response.error({
                ...params,
                error: {
                    ...error,
                    message: ex.message || error.message,
                    code: ex.code || error.code,
                    data: {
                        ...error.data,
                        ...ex.data,
                        input: this.store.getInput()
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
                    ...error.data,
                    input: this.store.getInput()
                }
            }
        });
    }
}
