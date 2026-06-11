import { EventHandler } from "~/features/events/EventHandler.js";
import { isHttpRequest } from "~/features/http/abstractions.js";
import type { EventContext } from "~/features/events/EventHandler.js";
import type { NextFunction } from "~/features/events/types.js";

class ErrorHandlerImpl implements EventHandler.Interface {
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

export const ErrorHandler = EventHandler.createImplementation({
    implementation: ErrorHandlerImpl,
    dependencies: []
});
