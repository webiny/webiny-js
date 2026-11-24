import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { HttpRouter } from "@webiny/event-handler-core";
import { internalServerErrorResponse } from "@webiny/event-handler-core";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { apiGatewayEventToHttpRequest } from "~/translators/apiGatewayEventToHttpRequest.js";
import { httpResponseToApiGatewayResult } from "~/translators/httpResponseToApiGatewayResult.js";

/*
 * The router turns its own errors into responses (`HttpErrorDecorator`), so the catch below only sees
 * an error from translating the response.
 */
class ApiGatewayHttpRouterHandlerImpl implements ApiGatewayEventHandler.Interface {
    constructor(private router: HttpRouter.Interface) {}

    async execute(ctx: EventContext<any>, _next: NextFunction): Promise<APIGatewayProxyResult> {
        const request = apiGatewayEventToHttpRequest(ctx.event);
        try {
            const response = await this.router.route(request);
            return httpResponseToApiGatewayResult(response);
        } catch (e) {
            console.error("HTTP handler error:", e);
            const response = internalServerErrorResponse();
            return httpResponseToApiGatewayResult(response);
        }
    }
}

export const ApiGatewayHttpRouterHandler = ApiGatewayEventHandler.createImplementation({
    implementation: ApiGatewayHttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
