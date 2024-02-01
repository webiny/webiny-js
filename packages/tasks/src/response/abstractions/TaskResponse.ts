import { ITaskDataInput, TaskResponseStatus } from "~/types";
import { IResponseError } from "./ResponseErrorResult";

export type ITaskResponseResult<
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> =
    | ITaskResponseDoneResult<O>
    | ITaskResponseContinueResult<I>
    | ITaskResponseErrorResult
    | ITaskResponseAbortedResult;

export interface ITaskResponseDoneResultOutput {
    error?: IResponseError;
    [key: string]:
        | string
        | string[]
        | number
        | boolean
        | undefined
        | Record<string, string | number>
        | IResponseError;
}
export interface ITaskResponseDoneResult<
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    message?: string;
    output?: O;
    status: TaskResponseStatus.DONE;
}

export interface ITaskResponseContinueResult<T = ITaskDataInput> {
    input: T;
    wait?: number;
    status: TaskResponseStatus.CONTINUE;
}

export interface ITaskResponseErrorResult {
    error: IResponseError;
    status: TaskResponseStatus.ERROR;
}

export interface ITaskResponseAbortedResult {
    status: TaskResponseStatus.ABORTED;
}

export interface ITaskResponseContinueOptionsUntil {
    date: Date;
}
export interface ITaskResponseContinueOptionsSeconds {
    seconds: number;
}

export type ITaskResponseContinueOptions =
    | ITaskResponseContinueOptionsUntil
    | ITaskResponseContinueOptionsSeconds;

export interface ITaskResponse<
    T = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    done: (message?: string, output?: O) => ITaskResponseDoneResult<O>;
    continue: (data: T, options?: ITaskResponseContinueOptions) => ITaskResponseContinueResult<T>;
    error: (error: IResponseError | Error | string) => ITaskResponseErrorResult;
    aborted: () => ITaskResponseAbortedResult;
}
