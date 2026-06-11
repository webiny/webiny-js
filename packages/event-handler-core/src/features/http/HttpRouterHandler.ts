import { EventHandler } from "~/features/events/EventHandler.js";
import { HttpRouter, isHttpRequest, RouteNotFoundError } from "~/features/http/abstractions.js";
import type { IHttpRouter } from "~/features/http/abstractions.js";
import type { EventContext } from "~/features/events/EventHandler.js";
import type { NextFunction } from "~/features/events/types.js";

class HttpRouterHandlerImpl implements EventHandler.Interface {
    constructor(private router: IHttpRouter) {}

    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        if (!isHttpRequest(ctx.event)) {
            return next();
        }

        try {
            return await this.router.route(ctx.event);
        } catch (err) {
            if (err instanceof RouteNotFoundError) {
                return next();
            }
            throw err;
        }
    }
}

export const HttpRouterHandler = EventHandler.createImplementation({
    implementation: HttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
