import { Webiny } from "@webiny/sdk";
import { WebinySdk as Abstraction } from "./abstractions.js";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";
import { EnvConfig } from "@webiny/app/features/envConfig";
import { ApiRequestHeadersResolver } from "@webiny/app/features/apiRequestHeaders/abstractions.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";

const OWN_HEADERS = new Set(["x-tenant", "authorization"]);

// Authenticated SDK singleton that configures the Webiny SDK with the API endpoint and a token
// provider that delegates to AuthenticationContext.getIdToken(). Each request reads the current
// tenant and the extensions' `ApiRequestHeaders`, as the GraphQL client does: the singleton is built
// once, but the tenant can change and extensions register their header providers later.
class WebinySdkImpl extends Webiny implements Abstraction.Interface {
    constructor(
        authContext: AuthenticationContext.Interface,
        envConfig: EnvConfig.Interface,
        tenantContext: TenantContext.Interface,
        headersResolver: ApiRequestHeadersResolver.Interface
    ) {
        super({
            endpoint: envConfig.get("apiUrl"),
            tenant: tenantContext.getCurrentTenant() || "root",
            token: async () => {
                const token = await authContext.getIdToken();
                return token ?? "";
            },
            headers: async () => {
                const headers: Record<string, string> = {};
                // A provider's header never replaces the tenant or the auth header, as with the GraphQL client.
                for (const [name, value] of Object.entries(await headersResolver.resolve())) {
                    if (value !== undefined && !OWN_HEADERS.has(name.toLowerCase())) {
                        headers[name] = String(value);
                    }
                }
                headers["x-tenant"] = tenantContext.getCurrentTenant() || "root";
                return headers;
            }
        });
    }
}

export const WebinySdk = Abstraction.createImplementation({
    implementation: WebinySdkImpl,
    dependencies: [AuthenticationContext, EnvConfig, TenantContext, ApiRequestHeadersResolver]
});
