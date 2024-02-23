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
            statusCode: params.statusCode || 200,
            error: {
                ...params.error,
                message: params.error?.message || params.message,
                code: params.error?.code || "UNKNOWN_ERROR",
                data: params.error?.data || {}
            }
        };
    }
}
