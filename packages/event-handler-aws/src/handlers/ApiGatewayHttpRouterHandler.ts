import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { HttpRouter, RouteNotFoundError } from "@webiny/event-handler-core";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { apiGatewayEventToHttpRequest } from "~/translators/apiGatewayEventToHttpRequest.js";
import { httpResponseToApiGatewayResult } from "~/translators/httpResponseToApiGatewayResult.js";

class ApiGatewayHttpRouterHandlerImpl implements ApiGatewayEventHandler.Interface {
    constructor(private router: HttpRouter.Interface) {}

    async execute(ctx: EventContext<any>, _next: NextFunction): Promise<APIGatewayProxyResult> {
        const request = apiGatewayEventToHttpRequest(ctx.event);
        try {
            const response = await this.router.route(request);
            return httpResponseToApiGatewayResult(response);
        } catch (e) {
            if (e instanceof RouteNotFoundError) {
                return httpResponseToApiGatewayResult({
                    statusCode: 404,
                    body: { message: e.message }
                });
            }
            if (e && typeof e === "object" && (e as any).code) {
                console.error("HTTP handler WebinyError:", (e as any).code, (e as any).message, e);
                return httpResponseToApiGatewayResult({
                    statusCode: 500,
                    body: {
                        message: (e as any).message,
                        code: (e as any).code,
                        data: (e as any).data ?? null
                    }
                });
            }
            console.error("HTTP handler error:", e);
            return httpResponseToApiGatewayResult({
                statusCode: 500,
                body: { message: "Internal server error" }
            });
        }
    }
}

export const ApiGatewayHttpRouterHandler = ApiGatewayEventHandler.createImplementation({
    implementation: ApiGatewayHttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
