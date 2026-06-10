import { HttpEventHandler } from "~/events/EventHandler.js";
import { isHttpRequest } from "~/http/abstractions.js";
import type { EventContext } from "~/events/EventHandler.js";
import type { NextFunction } from "~/events/types.js";

class ErrorHandlerImpl implements HttpEventHandler.Interface {
    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        try {
            return await next();
        } catch (err) {
            if (isHttpRequest(ctx.event)) {
                return {
                    statusCode: 500,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ error: "Internal server error" })
                };
            }
            throw err;
        }
    }
}

export const ErrorHandler = HttpEventHandler.createImplementation({
    implementation: ErrorHandlerImpl,
    dependencies: []
});
