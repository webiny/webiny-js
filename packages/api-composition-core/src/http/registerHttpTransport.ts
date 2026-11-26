import type { Abstraction, Container } from "@webiny/di";
import type { InputHandler } from "@webiny/api-kernel-core";
import { InputTenantSource } from "@webiny/api-core/features/tenancy/TenantScopes/index.js";
import { HttpRequestContextFeature } from "./HttpRequestContextFeature.js";
import { HttpTenantScopeRouter } from "./HttpTenantScopeRouter.js";
import { HttpInputTenantSource } from "./HttpInputTenantSource.js";

export interface IHttpTransportFeature {
    register(container: Container): void;
}

/**
 * Registers an HTTP transport feature (`ApiGatewayFeature`, `FunctionUrlStreamFeature`,
 * `NodeHttpFeature`) together with the tenant, identity and assume-permissions loading every API
 * request needs, in the one order that works. `inputHandler` is the transport's handler abstraction
 * (`ApiGatewayInputHandler`, …).
 *
 * The request is handled at request level first, in no tenant's scope: compression, CORS, error
 * responses, assume-permissions, then the tenant step. A CORS preflight is answered there, and an
 * unknown or disabled tenant fails there, without building a scope. Only then does the request enter
 * its tenant's scope (`HttpTenantScopeRouter`), where the identity loads and the route runs.
 *
 * `HttpRequestContextFeature` has to be registered first. A decorator registered earlier sits further
 * inside, so its decorators then run inside `ErrorResponseDecorator` and `CorsHeadersDecorator`, which
 * the transport feature registers through `HttpFeature`, and their responses and errors get the CORS
 * headers. In the other order, a rejected token's 401 reaches the browser without them and reads as a
 * CORS failure, and nothing else breaks to show it.
 */
export function registerHttpTransport(
    container: Container,
    transport: IHttpTransportFeature,
    inputHandler: Abstraction<InputHandler.Interface>
): void {
    HttpRequestContextFeature.register(container);
    transport.register(container);
    // Registered after HttpFeature, so it replaces the route matcher as HttpRouter's implementation.
    container.register(HttpTenantScopeRouter);
    // The transport's handler chain stays at request level; the router enters the tenant's scope.
    container.registerInstance(InputTenantSource, new HttpInputTenantSource(inputHandler));
}
