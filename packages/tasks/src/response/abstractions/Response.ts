import { ITaskEvent } from "~/handler/types";
import { IResponseContinueParams, IResponseContinueResult } from "./ResponseContinueResult";
import { IResponseDoneParams, IResponseDoneResult } from "./ResponseDoneResult";
import { IResponseErrorParams, IResponseErrorResult } from "./ResponseErrorResult";
import { IResponseStoppedResult } from "./ResponseStoppedResult";

export type IResponseFromParams =
    | IResponseDoneResult
    | IResponseContinueResult
    | IResponseErrorResult;

export type IResponseResult =
    | IResponseDoneResult
    | IResponseContinueResult
    | IResponseErrorResult
    | IResponseStoppedResult;

export interface IResponse {
    readonly event: ITaskEvent;
    from: (params: IResponseFromParams) => IResponseResult;
    done: (params?: IResponseDoneParams) => IResponseDoneResult;
    stopped: () => IResponseStoppedResult;
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
    stopped: () => Promise<IResponseStoppedResult>;
    error: (params: IResponseErrorParams) => Promise<IResponseErrorResult>;
}
