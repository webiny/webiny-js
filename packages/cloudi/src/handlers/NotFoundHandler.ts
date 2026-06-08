import { HttpEventHandler } from "../abstractions/EventHandler.js";
import { isHttpRequest } from "../abstractions/IHttp.js";
import type { EventContext } from "../abstractions/EventHandler.js";
import type { NextFunction } from "../types.js";

class NotFoundHandlerImpl implements HttpEventHandler.Interface {
    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        if (!isHttpRequest(ctx.event)) {
            return next();
        }
        return {
            statusCode: 404,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Not found" })
        };
    }
}

export const NotFoundHandler = HttpEventHandler.createImplementation({
    implementation: NotFoundHandlerImpl,
    dependencies: []
});
