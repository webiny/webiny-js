import {
    IResponse,
    IResponseError,
    ITaskResponse,
    ITaskResponseAbortedResult,
    ITaskResponseContinueOptions,
    ITaskResponseContinueResult,
    ITaskResponseDoneResult,
    ITaskResponseErrorResult
} from "./abstractions";
import { ITaskDataInput } from "~/types";

/**
 * There are options to send:
 * * seconds - number of seconds to wait
 * * date - date until which to wait
 */
const getWaitingTime = (options?: ITaskResponseContinueOptions): number | undefined => {
    if (!options) {
        return undefined;
    } else if ("seconds" in options) {
        return options.seconds;
    } else if ("date" in options) {
        const now = new Date();
        return (options.date.getTime() - now.getTime()) / 1000;
    }
    return undefined;
};

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

    public continue<T = ITaskDataInput>(
        input: T,
        options?: ITaskResponseContinueOptions
    ): ITaskResponseContinueResult {
        const wait = getWaitingTime(options);
        if (!wait || wait < 1) {
            return this.response.continue({
                input
            });
        }
        return this.response.continue({
            input,
            wait
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
