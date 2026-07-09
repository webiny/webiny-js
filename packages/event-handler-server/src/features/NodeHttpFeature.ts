import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { HttpFeature } from "@webiny/event-handler-core";
import { NodeHttpEventType } from "~/eventTypes/NodeHttpEventType.js";
import { NodeHttpRouterHandler } from "~/handlers/NodeHttpRouterHandler.js";

/**
 * Registers the transport-only Node HTTP server infrastructure:
 * - NodeHttpEventType (recognises an `IncomingMessage`)
 * - HttpFeature (HttpRouter + RequestContextInitializerDecorator + SecureHeadersDecorator)
 * - NodeHttpRouterHandler (terminal: translates IncomingMessage → IHttpRequest, routes via HttpRouter)
 *
 * Auth/tenant establishment (the extract→load decorators, which depend on api-core) is NOT here —
 * it lives in the composition layer (@webiny/api-event-handler-server), mirroring how the AWS
 * ApiGatewayFeature keeps event-handler-aws free of any api-* (domain) dependency.
 */
export const NodeHttpFeature = createFeature({
    name: "NodeHttp",
    register(container: Container) {
        container.register(NodeHttpEventType);
        HttpFeature.register(container);
        container.register(NodeHttpRouterHandler);
    }
});
