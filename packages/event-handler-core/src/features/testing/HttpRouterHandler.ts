import { TestHttpEventHandler } from "./TestHttpEventHandler.js";
import { HttpRouter, RouteNotFoundError } from "~/features/http/abstractions.js";
import { HttpClientError } from "~/features/http/HttpClientError.js";
import type { EventContext } from "~/features/events/EventHandler.js";
import type { NextFunction } from "~/features/events/types.js";
import type { IHttpRouter } from "~/features/http/abstractions.js";

class HttpRouterHandlerImpl implements TestHttpEventHandler.Interface {
    constructor(private router: IHttpRouter) {}

    async execute(ctx: EventContext, _next: NextFunction): Promise<any> {
        try {
            return await this.router.route(ctx.event);
        } catch (e) {
            if (e instanceof RouteNotFoundError) {
                return { statusCode: 404, body: { message: e.message } };
            }
            if (e instanceof HttpClientError) {
                return {
                    statusCode: e.statusCode,
                    headers: { "cache-control": "no-store" },
                    body: { message: e.message, code: e.code, data: e.data }
                };
            }
            // Propagate structured errors (e.g. WebinyError with code/data) for test visibility
            if (e && typeof e === "object" && (e as any).code) {
                return {
                    statusCode: 500,
                    body: {
                        message: (e as any).message,
                        code: (e as any).code,
                        data: (e as any).data ?? null
                    }
                };
            }
            return { statusCode: 500, body: { message: "Internal server error" } };
        }
    }
}

export const HttpRouterHandler = TestHttpEventHandler.createImplementation({
    implementation: HttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
