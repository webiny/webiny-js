import { HttpRouter, RouteNotFoundError } from "@webiny/event-handler-core";
import type { EventContext, IHttpResponse, NextFunction } from "@webiny/event-handler-core";
import { NodeHttpEventHandler } from "~/abstractions/NodeHttpEventHandler.js";
import { nodeHttpRequestFromIncomingMessage } from "~/translators/NodeHttpTranslator.js";

/**
 * Terminal handler for the Node HTTP server transport. Translates the raw `IncomingMessage` into an
 * IHttpRequest, dispatches it through the shared `HttpRouter`, and returns the IHttpResponse (which
 * `createNodeHandler` writes to the Node response). Mirrors AWS's `ApiGatewayHttpRouterHandler`,
 * minus the transport-specific response translation (the server writes IHttpResponse directly).
 */
class NodeHttpRouterHandlerImpl implements NodeHttpEventHandler.Interface {
    constructor(private router: HttpRouter.Interface) {}

    async execute(ctx: EventContext<any>, _next: NextFunction): Promise<IHttpResponse> {
        const request = await nodeHttpRequestFromIncomingMessage(ctx.event);
        try {
            return await this.router.route(request);
        } catch (e) {
            if (e instanceof RouteNotFoundError) {
                return { statusCode: 404, body: { message: e.message } };
            }
            if (e && typeof e === "object" && (e as any).code) {
                console.error("HTTP handler WebinyError:", (e as any).code, (e as any).message, e);
                return {
                    statusCode: 500,
                    body: {
                        message: (e as any).message,
                        code: (e as any).code,
                        data: (e as any).data ?? null
                    }
                };
            }
            console.error("HTTP handler error:", e);
            return { statusCode: 500, body: { message: "Internal server error" } };
        }
    }
}

export const NodeHttpRouterHandler = NodeHttpEventHandler.createImplementation({
    implementation: NodeHttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
