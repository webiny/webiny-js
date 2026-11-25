import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayInputHandler } from "~/abstractions/handlers/ApiGatewayInputHandler.js";
import { HttpRouter, RouteNotFoundError } from "@webiny/api-kernel-core";
import { codedErrorBody } from "@webiny/api-kernel-core";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";
import type { ICodedError } from "@webiny/api-kernel-core";
import { apiGatewayEventToHttpRequest } from "~/translators/apiGatewayEventToHttpRequest.js";
import { httpResponseToApiGatewayResult } from "~/translators/httpResponseToApiGatewayResult.js";

class ApiGatewayHttpRouterHandlerImpl implements ApiGatewayInputHandler.Interface {
    constructor(private router: HttpRouter.Interface) {}

    async execute(ctx: InputContext<any>, _next: NextFunction): Promise<APIGatewayProxyResult> {
        const request = apiGatewayEventToHttpRequest(ctx.input);
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
                const body = codedErrorBody(e as ICodedError);
                return httpResponseToApiGatewayResult({ statusCode: 500, body });
            }
            console.error("HTTP handler error:", e);
            return httpResponseToApiGatewayResult({
                statusCode: 500,
                body: { message: "Internal server error" }
            });
        }
    }
}

export const ApiGatewayHttpRouterHandler = ApiGatewayInputHandler.createImplementation({
    implementation: ApiGatewayHttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
