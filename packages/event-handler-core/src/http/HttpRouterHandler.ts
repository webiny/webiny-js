import { HttpEventHandler } from "~/events/EventHandler.js";
import { HttpRouter, isHttpRequest, RouteNotFoundError } from "~/http/abstractions.js";
import type { IHttpRouter } from "~/http/abstractions.js";
import type { EventContext } from "~/events/EventHandler.js";
import type { NextFunction } from "~/events/types.js";

class HttpRouterHandlerImpl implements HttpEventHandler.Interface {
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

export const HttpRouterHandler = HttpEventHandler.createImplementation({
    implementation: HttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
