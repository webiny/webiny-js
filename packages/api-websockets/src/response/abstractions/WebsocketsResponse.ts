import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IWebsocketsResponseOkParams {
    message?: string;
    data?: GenericRecord<string>;
}

export interface IWebsocketsResponseOkResult {
    statusCode: number;
    data?: GenericRecord<string>;
    message?: string;
}

export interface IWebsocketsResponseErrorParams {
    statusCode?: number;
    error?: Omit<IWebsocketsResponseErrorResultError, "data"> &
        Partial<Pick<IWebsocketsResponseErrorResultError, "data">>;
    message: string;
}

export interface IWebsocketsResponseErrorResultError {
    message: string;
    code: string;
    data: GenericRecord<string>;
    stack?: string;
}

export interface IWebsocketsResponseErrorResult {
    statusCode: number;
    error: IWebsocketsResponseErrorResultError;
}

export interface IWebsocketsResponse {
    ok(params?: IWebsocketsResponseOkParams): IWebsocketsResponseOkResult;
    error(params: IWebsocketsResponseErrorParams): IWebsocketsResponseErrorResult;
}

export const WebsocketsResponse = createAbstraction<IWebsocketsResponse>("WebsocketsResponse");

export namespace WebsocketsResponse {
    export type Interface = IWebsocketsResponse;
    export type OkParams = IWebsocketsResponseOkParams;
    export type OkResult = IWebsocketsResponseOkResult;
    export type ErrorParams = IWebsocketsResponseErrorParams;
    export type ErrorResult = IWebsocketsResponseErrorResult;
    export type ErrorResultError = IWebsocketsResponseErrorResultError;
}
