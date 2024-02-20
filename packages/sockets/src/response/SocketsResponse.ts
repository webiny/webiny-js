import {
    ISocketsResponse,
    ISocketsResponseErrorParams,
    ISocketsResponseErrorResult,
    ISocketsResponseOkParams,
    ISocketsResponseOkResult
} from "./abstractions/ISocketsResponse";

export class SocketsResponse implements ISocketsResponse {
    public ok(params?: ISocketsResponseOkParams): ISocketsResponseOkResult {
        return {
            statusCode: 200,
            ...params
        };
    }

    public error(params: ISocketsResponseErrorParams): ISocketsResponseErrorResult {
        return {
            ...params,
            statusCode: params.statusCode || 500,
            error: {
                ...params.error,
                code: params.error.code || "UNKNOWN_ERROR",
                data: params.error.data || {}
            }
        };
    }
}
