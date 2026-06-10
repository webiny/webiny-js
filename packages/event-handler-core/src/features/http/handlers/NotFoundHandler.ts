import { HttpEventHandler } from "~/features/events/EventHandler.js";
import { isHttpRequest } from "~/features/http/abstractions.js";
import type { EventContext } from "~/features/events/EventHandler.js";
import type { NextFunction } from "~/features/events/types.js";

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
