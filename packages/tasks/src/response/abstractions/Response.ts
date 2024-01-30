import { ITaskEvent } from "~/handler/types";
import { IResponseContinueParams, IResponseContinueResult } from "./ResponseContinueResult";
import { IResponseDoneParams, IResponseDoneResult } from "./ResponseDoneResult";
import { IResponseErrorParams, IResponseErrorResult } from "./ResponseErrorResult";
import { IResponseAbortedResult } from "./ResponseAbortedResult";
import { ITaskResponseDoneResultOutput } from "~/response/abstractions/TaskResponse";

export type IResponseFromParams =
    | IResponseDoneResult
    | IResponseContinueResult
    | IResponseErrorResult;

export type IResponseResult =
    | IResponseDoneResult
    | IResponseContinueResult
    | IResponseErrorResult
    | IResponseAbortedResult;

export interface IResponse {
    readonly event: ITaskEvent;

    setEvent: (event: ITaskEvent) => void;

    from: (params: IResponseFromParams) => IResponseResult;
    done: <O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput>(
        params?: IResponseDoneParams<O>
    ) => IResponseDoneResult<O>;
    aborted: () => IResponseAbortedResult;
    continue: (params: IResponseContinueParams) => IResponseContinueResult;
    error: (params: IResponseErrorParams) => IResponseErrorResult;
}

export interface IResponseAsync {
    readonly response: IResponse;

    from: (result: IResponseResult) => Promise<IResponseResult>;
    done: (params: IResponseDoneParams) => Promise<IResponseDoneResult>;
    continue: (
        params: IResponseContinueParams
    ) => Promise<IResponseContinueResult | IResponseErrorResult>;
    aborted: () => Promise<IResponseAbortedResult>;
    error: (params: IResponseErrorParams) => Promise<IResponseErrorResult>;
}
