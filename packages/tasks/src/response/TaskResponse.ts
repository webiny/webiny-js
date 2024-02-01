import {
    IResponse,
    IResponseError,
    ITaskResponse,
    ITaskResponseAbortedResult,
    ITaskResponseContinueOptions,
    ITaskResponseContinueResult,
    ITaskResponseDoneResult,
    ITaskResponseDoneResultOutput,
    ITaskResponseErrorResult
} from "./abstractions";
import { ITaskDataInput } from "~/types";
import { getErrorProperties } from "~/utils/getErrorProperties";

/**
 * 355 days transformed into seconds.
 */
const MAX_WAITING_TIME = 30672000;

/**
 * There are options to send:
 * * seconds - number of seconds to wait
 * * date - date until which to wait
 */
const getWaitingTime = (options?: ITaskResponseContinueOptions): number | undefined => {
    let waitingTime: number | undefined;
    if (!options) {
        return undefined;
    }
    if ("seconds" in options) {
        waitingTime = options.seconds;
    } else if ("date" in options) {
        const now = new Date();
        waitingTime = (options.date.getTime() - now.getTime()) / 1000;
    }
    if (!waitingTime || waitingTime < 0) {
        return undefined;
    }
    return waitingTime > MAX_WAITING_TIME ? MAX_WAITING_TIME : waitingTime;
};

export class TaskResponse implements ITaskResponse {
    private readonly response: IResponse;

    public constructor(response: IResponse) {
        this.response = response;
    }

    public done<O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput>(
        message?: string,
        output?: O
    ): ITaskResponseDoneResult<O> {
        return this.response.done<O>({
            message,
            output: output || ({} as O)
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

    public error(error: IResponseError | Error | string): ITaskResponseErrorResult {
        return this.response.error({
            error: this.getError(error)
        });
    }

    public aborted(): ITaskResponseAbortedResult {
        return this.response.aborted();
    }

    private getError(error: IResponseError | Error | string): IResponseError | Error {
        if (error instanceof Error) {
            return getErrorProperties(error);
        } else if (typeof error === "string") {
            return new Error(error);
        }
        return error;
    }
}
