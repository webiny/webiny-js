import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { HttpFeature } from "@webiny/event-handler-core";
import { ApiGatewayEventType } from "~/eventTypes/ApiGatewayEventType.js";
import { ApiGatewayHttpRouterHandler } from "~/handlers/ApiGatewayHttpRouterHandler.js";
import { ApiGatewayIdentityLoaderDecorator } from "~/handlers/ApiGatewayIdentityLoaderDecorator.js";
import { ApiGatewayTenantLoaderDecorator } from "~/handlers/ApiGatewayTenantLoaderDecorator.js";

/**
 * Registers the full API Gateway infrastructure for a Lambda handler:
 * - ApiGatewayEventType (recognises API GW Lambda events)
 * - HttpFeature (HttpRouter + RequestContextInitializerDecorator + SecureHeadersDecorator)
 * - ApiGatewayHttpRouterHandler (terminal: translates APIGw ↔ IHttpRequest, routes via HttpRouter)
 * - auth + tenant: two decorators that EXTRACT the token/tenant-id from the event into
 *   RawAuthToken/RawTenantId and invoke the shared, transport-agnostic LOAD steps
 *   (RequestIdentityLoader / RequestTenantLoader in api-core) before routing.
 *
 * Ordering: registerDecorator applies LATER registrations as the OUTER wrapper (whose execute() runs
 * first). Identity must be established before tenant, so the tenant decorator is registered first
 * (inner) and the identity decorator last (outer) → identity runs, then tenant, then the router.
 */
export const ApiGatewayFeature = createFeature({
    name: "ApiGateway",
    register(container: Container) {
        container.register(ApiGatewayEventType);
        HttpFeature.register(container);
        container.register(ApiGatewayHttpRouterHandler);

        // ── Auth + tenant (extract → shared load) ──────────────────
        container.registerDecorator(ApiGatewayTenantLoaderDecorator);
        container.registerDecorator(ApiGatewayIdentityLoaderDecorator);
    }
});
