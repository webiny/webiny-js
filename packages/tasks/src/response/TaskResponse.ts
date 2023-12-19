import {
    IResponse,
    IResponseError,
    ITaskResponse,
    ITaskResponseContinueResult,
    ITaskResponseDoneResult,
    ITaskResponseErrorResult,
    ITaskResponseAbortedResult
} from "./abstractions";
import { ITaskDataValues } from "~/types";

export class TaskResponse implements ITaskResponse {
    private readonly response: IResponse;

    public constructor(response: IResponse) {
        this.response = response;
    }

    public done(message?: string): ITaskResponseDoneResult {
        return this.response.done({
            message
        });
    }

    public continue<T = ITaskDataValues>(values: T): ITaskResponseContinueResult {
        return this.response.continue({
            values
        });
    }

    public error(error: IResponseError): ITaskResponseErrorResult {
        return this.response.error({
            error
        });
    }

    public aborted(): ITaskResponseAbortedResult {
        return this.response.aborted();
    }
}
