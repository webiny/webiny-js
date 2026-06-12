import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import {
    ApiGatewayAuthDecorator,
    ApiGatewayTenantDecorator
} from "~/handlers/ApiGatewaySecurityDecorators.js";

/**
 * Registers auth and tenant decorators for the API Gateway event handler chain.
 * Must be registered AFTER ApiGatewayFeature (which registers the base terminal handler).
 *
 * Decorator execution order (last registered = outermost = first to execute):
 *   ApiGatewayAuthDecorator → ApiGatewayTenantDecorator → ApiGatewayHttpRouterHandler
 *
 * Usage:
 *   ApiGatewayFeature.register(container);          // base handler
 *   ApiGatewaySecurityFeature.register(container);  // auth + tenant decorators
 */
export const ApiGatewaySecurityFeature = createFeature({
    name: "ApiGatewaySecurity",
    register(container: Container) {
        container.registerDecorator(ApiGatewayTenantDecorator);
        container.registerDecorator(ApiGatewayAuthDecorator);
    }
});
