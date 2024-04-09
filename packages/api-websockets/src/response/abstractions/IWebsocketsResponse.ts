import { GenericRecord } from "@webiny/api/types";

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
