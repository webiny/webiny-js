import { CloudHandler } from "../abstractions/CloudHandler.js";
import { isHttpRequest } from "../abstractions/IHttp.js";
import type { NextFunction } from "../types.js";

class NotFoundHandlerImpl implements CloudHandler.Interface {
    async execute(event: any, next: NextFunction): Promise<any> {
        if (!isHttpRequest(event)) return next();
        return {
            statusCode: 404,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Not found" })
        };
    }
}

export const NotFoundHandler = CloudHandler.createImplementation({
    implementation: NotFoundHandlerImpl,
    dependencies: []
});
