import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { HttpFeature } from "@webiny/event-handler-core";
import { ApiGatewayEventType } from "~/eventTypes/ApiGatewayEventType.js";
import { ApiGatewayHttpRouterHandler } from "~/handlers/ApiGatewayHttpRouterHandler.js";
import { ApiGatewayIdentityEstablisherDecorator } from "~/handlers/ApiGatewayIdentityEstablisherDecorator.js";
import { ApiGatewayTenantEstablisherDecorator } from "~/handlers/ApiGatewayTenantEstablisherDecorator.js";
import { ApiGatewayBearerAuthTokenExtractor } from "~/extractors/ApiGatewayBearerAuthTokenExtractor.js";
import { ApiGatewayCookieAuthTokenExtractor } from "~/extractors/ApiGatewayCookieAuthTokenExtractor.js";
import { ApiGatewayTenantIdExtractor } from "~/extractors/ApiGatewayTenantIdExtractor.js";

/**
 * Registers the full API Gateway infrastructure for a Lambda handler:
 * - ApiGatewayEventType (recognises API GW Lambda events)
 * - HttpFeature (HttpRouter + RequestContextInitializerDecorator + SecureHeadersDecorator)
 * - ApiGatewayHttpRouterHandler (terminal: translates APIGw ↔ IHttpRequest, routes via HttpRouter)
 * - auth + tenant establishment: the transport-specific extractors (where the tenant id / auth token
 *   live in the event) plus two thin decorators that drive the shared, transport-agnostic
 *   establishers (RequestIdentityEstablisher / RequestTenantEstablisher in api-core) before routing.
 *
 * Ordering notes:
 * - Auth token sources are tried in registration order: bearer header first, then the auth cookie.
 * - registerDecorator applies LATER registrations as the OUTER wrapper (whose execute() runs first).
 *   Identity must be established before tenant, so the tenant decorator is registered first (inner)
 *   and the identity decorator last (outer) → identity runs, then tenant, then the router.
 */
export const ApiGatewayFeature = createFeature({
    name: "ApiGateway",
    register(container: Container) {
        container.register(ApiGatewayEventType);
        HttpFeature.register(container);
        container.register(ApiGatewayHttpRouterHandler);

        // ── Auth + tenant ──────────────────────────────────────────
        container.register(ApiGatewayBearerAuthTokenExtractor);
        container.register(ApiGatewayCookieAuthTokenExtractor);
        container.register(ApiGatewayTenantIdExtractor);
        container.registerDecorator(ApiGatewayTenantEstablisherDecorator);
        container.registerDecorator(ApiGatewayIdentityEstablisherDecorator);
    }
});
