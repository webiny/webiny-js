import { CloudHandler } from "@cloudi/core";
import type { IHttpRequest, NextFunction } from "@cloudi/core";
import { GreetService } from "../services/GreetService.js";
import type { IGreetService } from "../services/GreetService.js";

class HelloHandlerImpl implements CloudHandler.Interface {
    constructor(private svc: IGreetService) {}

    private matches(event: any): boolean {
        return event?.method === "GET" && event?.path?.startsWith("/hello");
    }

    async execute(event: any, next: NextFunction) {
        if (!this.matches(event)) {
            return next();
        }
        const req = event as IHttpRequest;
        const name = req.query["name"] || "world";
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: { message: this.svc.greet(name) }
        };
    }
}

export const helloHandler = CloudHandler.createImplementation({
    implementation: HelloHandlerImpl,
    dependencies: [GreetService]
});
