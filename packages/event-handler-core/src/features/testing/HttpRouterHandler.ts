import { EventHandler } from "~/features/events/EventHandler.js";
import { HttpRouter, RouteNotFoundError } from "~/features/http/abstractions.js";
import type { EventContext } from "~/features/events/EventHandler.js";
import type { NextFunction } from "~/features/events/types.js";
import type { IHttpRouter } from "~/features/http/abstractions.js";

class HttpRouterHandlerImpl implements EventHandler.Interface {
    constructor(private router: IHttpRouter) {}

    async execute(ctx: EventContext, _next: NextFunction): Promise<any> {
        try {
            return await this.router.route(ctx.event);
        } catch (e) {
            if (e instanceof RouteNotFoundError) {
                return { statusCode: 404, body: { message: e.message } };
            }
            return { statusCode: 500, body: { message: "Internal server error" } };
        }
    }
}

export const HttpRouterHandler = EventHandler.createImplementation({
    implementation: HttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
