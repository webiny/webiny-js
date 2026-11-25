import { createFeature } from "@webiny/feature/api";
import { HttpIdentityLoaderDecorator } from "./HttpIdentityLoaderDecorator.js";
import { HttpTenantLoaderDecorator } from "./HttpTenantLoaderDecorator.js";
import { HttpAssumePermissionsDecorator } from "./HttpAssumePermissionsDecorator.js";

/**
 * Sets up the tenant, the identity and the previewed permissions for every HTTP request, on every
 * transport, by decorating `HttpRouter`.
 *
 * Register it BEFORE the transport feature (`ApiGatewayFeature`, `FunctionUrlStreamFeature`,
 * `NodeHttpFeature`), which registers `HttpFeature`. A decorator registered earlier sits further
 * inside, so these run inside `SecureHeadersDecorator` and `HttpErrorDecorator`: their responses and
 * errors get the CORS headers, and a CORS preflight is answered before any of them runs. Registered
 * after it, a rejected token's 401 reaches the browser without CORS headers and reads as a CORS
 * failure.
 *
 * Within this feature, a later registration is the outer wrapper, so the order they run in is:
 * assume-permissions, tenant, identity. The tenant comes before the identity because API-key
 * authentication looks the key up in the tenant's partition.
 */
export const HttpRequestContextFeature = createFeature({
    name: "HttpRequestContext",
    register(container) {
        container.registerDecorator(HttpIdentityLoaderDecorator);
        container.registerDecorator(HttpTenantLoaderDecorator);
        container.registerDecorator(HttpAssumePermissionsDecorator);
    }
});
