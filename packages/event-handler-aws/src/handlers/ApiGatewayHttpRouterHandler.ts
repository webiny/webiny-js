import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { HttpRouter, RouteNotFoundError } from "@webiny/event-handler-core";
import type {
    EventContext,
    NextFunction,
    IHttpRequest,
    IHttpResponse
} from "@webiny/event-handler-core";

class ApiGatewayHttpRouterHandlerImpl implements ApiGatewayEventHandler.Interface {
    constructor(private router: HttpRouter.Interface) {}

    async execute(ctx: EventContext<IHttpRequest>, _next: NextFunction): Promise<IHttpResponse> {
        try {
            return await this.router.route(ctx.event);
        } catch (e) {
            if (e instanceof RouteNotFoundError) {
                return { statusCode: 404, body: { message: e.message } };
            }
            if (e && typeof e === "object" && (e as any).code) {
                return {
                    statusCode: 500,
                    body: {
                        message: (e as any).message,
                        code: (e as any).code,
                        data: (e as any).data ?? null
                    }
                };
            }
            return { statusCode: 500, body: { message: "Internal server error" } };
        }
    }
}

export const ApiGatewayHttpRouterHandler = ApiGatewayEventHandler.createImplementation({
    implementation: ApiGatewayHttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
