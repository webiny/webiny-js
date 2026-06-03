import { CloudHandler } from "../abstractions/CloudHandler.js";
import { isHttpRequest } from "../abstractions/IHttp.js";
import type { NextFunction } from "../types.js";

class ErrorHandlerImpl implements CloudHandler.Interface {
    async execute(event: any, next: NextFunction): Promise<any> {
        try {
            return await next();
        } catch (err) {
            if (isHttpRequest(event)) {
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

export const ErrorHandler = CloudHandler.createImplementation({
    implementation: ErrorHandlerImpl,
    dependencies: []
});
