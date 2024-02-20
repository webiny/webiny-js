import { GenericRecord } from "@webiny/api/types";

export interface ISocketsResponseOkParams {
    message?: string;
    data?: GenericRecord<string>;
}

export interface ISocketsResponseOkResult {
    statusCode: number;
    data?: GenericRecord<string>;
    message?: string;
}

export interface ISocketsResponseErrorParams {
    statusCode?: number;
    error: Omit<ISocketsResponseErrorResultError, "data"> &
        Partial<Pick<ISocketsResponseErrorResultError, "data">>;
    message: string;
}

export interface ISocketsResponseErrorResultError {
    message: string;
    code: string;
    data: GenericRecord<string>;
    stack?: string;
}

export interface ISocketsResponseErrorResult {
    statusCode: number;
    error: ISocketsResponseErrorResultError;
}

export interface ISocketsResponse {
    ok(params?: ISocketsResponseOkParams): ISocketsResponseOkResult;
    error(params: ISocketsResponseErrorParams): ISocketsResponseErrorResult;
}
