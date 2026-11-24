import { HttpRouter, RouteNotFoundError } from "~/features/http/abstractions.js";
import type { IHttpRouter, IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";
import { codedErrorBody } from "~/features/http/codedErrorBody.js";
import type { ICodedError } from "~/features/http/codedErrorBody.js";

const JSON_HEADERS = { "content-type": "application/json" };

function isCodedError(error: unknown): error is ICodedError {
    return Boolean(error && typeof error === "object" && (error as ICodedError).code);
}

function errorResponse(error: unknown): IHttpResponse {
    if (error instanceof RouteNotFoundError) {
        return { statusCode: 404, headers: JSON_HEADERS, body: { message: error.message } };
    }
    if (isCodedError(error)) {
        console.error("HTTP handler WebinyError:", error.code, error.message, error);
        const body = codedErrorBody(error);
        return { statusCode: 500, headers: JSON_HEADERS, body };
    }
    console.error("HTTP handler error:", error);
    return {
        statusCode: 500,
        headers: JSON_HEADERS,
        body: { message: "Internal server error" }
    };
}

/**
 * Turns an error thrown while handling a request into a response, so it comes back through
 * `SecureHeadersDecorator` and gets the CORS headers like any other response. A browser on another
 * origin cannot read a response without them, and reports a CORS failure instead of the error.
 *
 * It catches what a route throws and what the decorators inside it throw, such as the API's tenant
 * and identity loaders. Those are registered before `HttpFeature` so they sit inside this decorator.
 */
class HttpErrorDecoratorImpl implements IHttpRouter {
    constructor(private decoratee: IHttpRouter) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        try {
            return await this.decoratee.route(request);
        } catch (error) {
            return errorResponse(error);
        }
    }
}

export const HttpErrorDecorator = HttpRouter.createDecorator({
    decorator: HttpErrorDecoratorImpl,
    dependencies: []
});
