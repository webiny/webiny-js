import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ApiGatewayHttpHeadersAuthDecorator } from "~/handlers/ApiGatewayHttpHeadersAuthDecorator.js";
import { ApiGatewayCookieAuthDecorator } from "~/handlers/ApiGatewayCookieAuthDecorator.js";
import { ApiGatewayTenantDecorator } from "~/handlers/ApiGatewayTenantDecorator.js";

/**
 * Registers auth and tenant decorators for the API Gateway event handler chain.
 * Must be registered AFTER ApiGatewayFeature (which registers the base terminal handler).
 *
 * Decorator execution order (last registered = outermost = first to execute):
 *   ApiGatewayHttpHeadersAuthDecorator → ApiGatewayCookieAuthDecorator → ApiGatewayTenantDecorator → ApiGatewayHttpRouterHandler
 *
 * Usage:
 *   ApiGatewayFeature.register(container);          // base handler
 *   ApiGatewaySecurityFeature.register(container);  // auth + tenant decorators
 */
export const ApiGatewaySecurityFeature = createFeature({
    name: "ApiGatewaySecurity",
    register(container: Container) {
        container.registerDecorator(ApiGatewayTenantDecorator);
        container.registerDecorator(ApiGatewayCookieAuthDecorator);
        container.registerDecorator(ApiGatewayHttpHeadersAuthDecorator);
    }
});
