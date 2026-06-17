import { WebsocketsResponse as WebsocketsResponseAbstraction } from "./abstractions/WebsocketsResponse.js";

class WebsocketsResponse implements WebsocketsResponseAbstraction.Interface {
    public ok(
        params?: WebsocketsResponseAbstraction.OkParams
    ): WebsocketsResponseAbstraction.OkResult {
        return {
            statusCode: 200,
            ...params
        };
    }

    public error(
        params: WebsocketsResponseAbstraction.ErrorParams
    ): WebsocketsResponseAbstraction.ErrorResult {
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

export const DefaultWebsocketsResponse = WebsocketsResponseAbstraction.createImplementation({
    implementation: WebsocketsResponse,
    dependencies: []
});
