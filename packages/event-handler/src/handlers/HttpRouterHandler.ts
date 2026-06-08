import { HttpEventHandler } from "../abstractions/EventHandler.js";
import { HttpRouter, isHttpRequest, RouteNotFoundError } from "../abstractions/IHttp.js";
import type { IHttpRouter } from "../abstractions/IHttp.js";
import type { EventContext } from "../abstractions/EventHandler.js";
import type { NextFunction } from "../types.js";

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
