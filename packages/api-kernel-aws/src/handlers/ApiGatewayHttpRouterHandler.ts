import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayInputHandler } from "~/abstractions/handlers/ApiGatewayInputHandler.js";
import { HttpRouter } from "@webiny/api-kernel-core";
import { internalServerErrorResponse } from "@webiny/api-kernel-core";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";
import { apiGatewayEventToHttpRequest } from "~/translators/apiGatewayEventToHttpRequest.js";
import { httpResponseToApiGatewayResult } from "~/translators/httpResponseToApiGatewayResult.js";

/*
 * The router turns its own errors into responses (`ErrorResponseDecorator`), so the catch below only sees
 * an error from translating the response.
 */
class ApiGatewayHttpRouterHandlerImpl implements ApiGatewayInputHandler.Interface {
    constructor(private router: HttpRouter.Interface) {}

    async execute(ctx: InputContext<any>, _next: NextFunction): Promise<APIGatewayProxyResult> {
        const request = apiGatewayEventToHttpRequest(ctx.input);
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

export const ApiGatewayHttpRouterHandler = ApiGatewayInputHandler.createImplementation({
    implementation: ApiGatewayHttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
