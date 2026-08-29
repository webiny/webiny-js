import { HttpResponseBuilder } from "./HttpResponseBuilder.js";
import type {
    IHttpRequest,
    IHttpResponse,
    IHttpResponseBuilder,
    IHttpRoute
} from "./abstractions.js";

function isResponseBuilder(value: unknown): value is IHttpResponseBuilder {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as IHttpResponseBuilder).toResponse === "function"
    );
}

/**
 * Normalize whatever a route's `handle()` returned into an IHttpResponse.
 *
 * A route can (a) return the response builder it was handed, (b) mutate it and return nothing, or
 * (c) return a plain IHttpResponse object — the pre-builder style. In case (c) anything set on the
 * builder is merged UNDERNEATH the returned object, so a route can mix the two (e.g.
 * `response.cookie(...)` plus a literal return) and the explicit return wins on conflicts.
 */
export function toHttpResponse(result: unknown, builder: HttpResponseBuilder): IHttpResponse {
    if (result === undefined || result === null) {
        return builder.toResponse();
    }

    if (isResponseBuilder(result)) {
        return result.toResponse();
    }

    const response = result as IHttpResponse;

    if (!builder.isModified()) {
        return response;
    }

    const built = builder.toResponse();
    const cookies = [...(built.cookies ?? []), ...(response.cookies ?? [])];

    return {
        ...response,
        headers: { ...built.headers, ...response.headers },
        ...(cookies.length > 0 ? { cookies } : {})
    };
}

/**
 * Run a single route and get its IHttpResponse — the same call + normalization `HttpRouter` does,
 * minus the path matching. Use it to exercise a route directly (typically in tests) instead of
 * calling `route.handle()` by hand, which would leave the response builder undefined.
 */
export async function invokeHttpRoute(
    route: IHttpRoute,
    request: IHttpRequest
): Promise<IHttpResponse> {
    const response = new HttpResponseBuilder();
    return toHttpResponse(await route.handle(request, response), response);
}
