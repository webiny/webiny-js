import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { HttpFeature } from "@webiny/event-handler-core";
import { ApiGatewayEventType } from "~/eventTypes/ApiGatewayEventType.js";
import { ApiGatewayHttpRouterHandler } from "~/handlers/ApiGatewayHttpRouterHandler.js";

/**
 * Registers the core API Gateway infrastructure:
 * - ApiGatewayEventType (recognises API GW Lambda events)
 * - HttpFeature (HttpRouter + SecureHeadersDecorator)
 * - ApiGatewayHttpRouterHandler (terminal: translates APIGw ↔ IHttpRequest, routes via HttpRouter)
 *
 * Auth and tenant initialisation are NOT included here — register them separately
 * as ApiGatewayEventHandler decorators (e.g. ApiGatewaySecurityFeature).
 */
export const ApiGatewayFeature = createFeature({
    name: "ApiGateway",
    register(container: Container) {
        container.register(ApiGatewayEventType);
        HttpFeature.register(container);
        container.register(ApiGatewayHttpRouterHandler);
    }
});
