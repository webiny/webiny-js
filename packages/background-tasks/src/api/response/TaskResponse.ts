import type {
    IResponse,
    IResponseError,
    ITaskResponse,
    ITaskResponseContinueOptions
} from "./abstractions/index.js";
import type { ITaskDataInput } from "~/api/types.js";
import { getErrorProperties } from "~/api/utils/getErrorProperties.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

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

    public done<O extends TaskDefinition.ResultDone = TaskDefinition.ResultDone>(
        message?: string | O,
        output?: O
    ): TaskDefinition.ResultDone<O> {
        if (typeof message === "object" && !output) {
            return this.response.done({
                output: message
            });
        }
        return this.response.done<O>({
            message: message as string,
            output
        });
    }

    public continue<T = ITaskDataInput>(
        input: T,
        options?: ITaskResponseContinueOptions
    ): TaskDefinition.ResultContinue {
        const wait = getWaitingTime(options);
        if (!wait || wait < 1) {
            return this.response.continue({
                input: input as ITaskDataInput
            });
        }
        return this.response.continue({
            input: input as ITaskDataInput,
            wait
        });
    }

    public error(error: IResponseError | Error | string): TaskDefinition.ResultError {
        return this.response.error({
            error: this.getError(error)
        });
    }

    public aborted(): TaskDefinition.ResultAborted {
        return this.response.aborted();
    }

    private getError(error: IResponseError | Error | string): IResponseError | Error {
        if (error instanceof Error) {
            return getErrorProperties(error);
        } else if (typeof error === "string") {
            return getErrorProperties(new Error(error));
        }
        return getErrorProperties(error);
    }
}
