import { createFeature } from "@webiny/feature/api";
import { HttpIdentityLoaderDecorator } from "./HttpIdentityLoaderDecorator.js";
import { HttpAssumePermissionsDecorator } from "./HttpAssumePermissionsDecorator.js";

/**
 * Sets up the previewed permissions and the identity for every HTTP request, on every transport.
 * The tenant step, and the hand-off into the tenant's scope, is `HttpTenantScopeRouter`, which
 * `registerHttpTransport` registers after the transport feature.
 *
 * Register it BEFORE the transport feature (`ApiGatewayFeature`, `FunctionUrlStreamFeature`,
 * `NodeHttpFeature`), which registers `HttpFeature`. A decorator registered earlier sits further
 * inside, so these run inside `CorsHeadersDecorator` and `ErrorResponseDecorator`: their responses and
 * errors get the CORS headers, and a CORS preflight is answered before any of them runs. Registered
 * after it, a rejected token's 401 reaches the browser without CORS headers and reads as a CORS
 * failure.
 *
 * They run in this order: assume-permissions at request level (a raw header value), then the tenant
 * step and the hand-off, then the identity in the tenant's scope. The tenant comes before the
 * identity because API-key authentication looks the key up in the tenant's partition.
 */
export const HttpRequestContextFeature = createFeature({
    name: "HttpRequestContext",
    register(container) {
        // Decorates HttpRouteDispatcher, which the hand-off resolves from the tenant's scope.
        container.registerDecorator(HttpIdentityLoaderDecorator);
        // Decorates HttpRouter, at request level.
        container.registerDecorator(HttpAssumePermissionsDecorator);
    }
});
