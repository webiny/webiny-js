import { HttpRoute } from "@webiny/event-handler";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler";
import { GreetService } from "../services/GreetService.js";
import type { IGreetService } from "../services/GreetService.js";

class HelloHandlerImpl implements HttpRoute.Interface {
    readonly method = "GET";
    readonly path = "/hello";

    constructor(private svc: IGreetService) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        const name = request.query["name"] || "world";
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: { message: this.svc.greet(name) }
        };
    }
}

export const helloHandler = HttpRoute.createImplementation({
    implementation: HelloHandlerImpl,
    dependencies: [GreetService]
});
