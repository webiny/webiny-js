import type { Container } from "@webiny/di";
import { HttpRequestContextFeature } from "./HttpRequestContextFeature.js";

export interface IHttpTransportFeature {
    register(container: Container): void;
}

/**
 * Registers an HTTP transport feature (`ApiGatewayFeature`, `FunctionUrlStreamFeature`,
 * `NodeHttpFeature`) together with the tenant, identity and assume-permissions loading every API
 * request needs, in the one order that works.
 *
 * `HttpRequestContextFeature` has to be registered first. A decorator registered earlier sits further
 * inside, so its decorators then run inside `HttpErrorDecorator` and `SecureHeadersDecorator`, which
 * the transport feature registers through `HttpFeature`, and their responses and errors get the CORS
 * headers. In the other order, a rejected token's 401 reaches the browser without them and reads as a
 * CORS failure, and nothing else breaks to show it.
 */
export function registerHttpTransport(
    container: Container,
    transport: IHttpTransportFeature
): void {
    HttpRequestContextFeature.register(container);
    transport.register(container);
}
