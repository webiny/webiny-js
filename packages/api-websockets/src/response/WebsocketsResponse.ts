import {
    IWebsocketsResponse,
    IWebsocketsResponseErrorParams,
    IWebsocketsResponseErrorResult,
    IWebsocketsResponseOkParams,
    IWebsocketsResponseOkResult
} from "./abstractions/IWebsocketsResponse";

export class WebsocketsResponse implements IWebsocketsResponse {
    public ok(params?: IWebsocketsResponseOkParams): IWebsocketsResponseOkResult {
        return {
            statusCode: 200,
            ...params
        };
    }

    public error(params: IWebsocketsResponseErrorParams): IWebsocketsResponseErrorResult {
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
