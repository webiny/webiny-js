import { HttpRouter } from "~/http/abstractions.js";
import type { IHttpRouter, IHttpRequest, IHttpResponse } from "~/http/abstractions.js";

const ALLOWED_HEADERS = [
    "accept",
    "authorization",
    "cache-control",
    "content-type",
    "x-i18n-locale",
    "x-tenant",
    "x-apollo-tracing",
    "apollo-query-plan-experimental"
].join(", ");

class SecureHeadersDecoratorImpl implements IHttpRouter {
    constructor(private decoratee: IHttpRouter) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        if (request.method === "OPTIONS") {
            return this.optionsResponse(request);
        }

        const response = await this.decoratee.route(request);

        return {
            ...response,
            headers: {
                ...response.headers,
                "access-control-allow-origin": request.headers["origin"] || "*",
                "access-control-allow-credentials": "true",
                vary: "origin"
            }
        };
    }

    private optionsResponse(request: IHttpRequest): IHttpResponse {
        return {
            statusCode: 204,
            headers: {
                "access-control-allow-origin": request.headers["origin"] || "*",
                "access-control-allow-credentials": "true",
                "access-control-allow-methods": "OPTIONS,POST,GET,DELETE,PUT,PATCH",
                "access-control-allow-headers": ALLOWED_HEADERS,
                "access-control-max-age": "86400",
                "cache-control": "public, max-age=86400"
            }
        };
    }
}

export const SecureHeadersDecorator = HttpRouter.createDecorator({
    decorator: SecureHeadersDecoratorImpl,
    dependencies: []
});
