import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ApiGatewaySecurityDecorator } from "~/handlers/ApiGatewaySecurityDecorator.js";
import { ApiGatewayBearerAuthTokenExtractor } from "~/extractors/ApiGatewayBearerAuthTokenExtractor.js";
import { ApiGatewayCookieAuthTokenExtractor } from "~/extractors/ApiGatewayCookieAuthTokenExtractor.js";
import { ApiGatewayTenantIdExtractor } from "~/extractors/ApiGatewayTenantIdExtractor.js";

/**
 * Registers auth + tenant handling for the API Gateway event handler chain.
 * Must be registered AFTER ApiGatewayFeature (which registers the base terminal handler).
 *
 * The transport-specific part is just the extractors (where the tenant id / auth token live in the
 * event). The shared RequestPrincipalEstablisher (api-core) does the actual authentication and
 * tenant resolution. A single thin decorator drives it before the router handler runs.
 *
 * Auth token sources are tried in registration order: bearer header first, then the auth cookie.
 */
export const ApiGatewaySecurityFeature = createFeature({
    name: "ApiGatewaySecurity",
    register(container: Container) {
        container.register(ApiGatewayBearerAuthTokenExtractor);
        container.register(ApiGatewayCookieAuthTokenExtractor);
        container.register(ApiGatewayTenantIdExtractor);
        container.registerDecorator(ApiGatewaySecurityDecorator);
    }
});
