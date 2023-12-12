import {
    IResponse,
    IResponseError,
    ITaskResponse,
    ITaskResponseContinueResult,
    ITaskResponseDoneResult,
    ITaskResponseErrorResult
} from "./abstractions";

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

    public continue<T = Record<string, any>>(input: T): ITaskResponseContinueResult {
        return this.response.continue({
            input
        });
    }

    public error(error: IResponseError): ITaskResponseErrorResult {
        return this.response.error({
            error
        });
    }
}
