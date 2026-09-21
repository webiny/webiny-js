import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { HttpFeature } from "@webiny/event-handler-core";
import { ApiGatewayEventType } from "~/eventTypes/ApiGatewayEventType.js";
import { ApiGatewayHttpRouterHandler } from "~/handlers/ApiGatewayHttpRouterHandler.js";

/**
 * Registers the transport-only API Gateway infrastructure for a Lambda handler:
 * - ApiGatewayEventType (recognises API GW Lambda events)
 * - HttpFeature (HttpRouter + SecureHeadersDecorator)
 * - ApiGatewayHttpRouterHandler (terminal: translates APIGw ↔ IHttpRequest, routes via HttpRouter)
 *
 * Auth/tenant establishment (the extract→load decorators, which depend on api-core) is NOT here —
 * it lives in the composition layer (@webiny/api-event-handler-aws), which registers those decorators after
 * this feature. That keeps event-handler-aws free of any api-* (domain) dependency.
 */
export const ApiGatewayFeature = createFeature({
    name: "ApiGateway",
    register(container: Container) {
        container.register(ApiGatewayEventType);
        HttpFeature.register(container);
        container.register(ApiGatewayHttpRouterHandler);
    }
});
