import { Webiny } from "@webiny/sdk";
import { WebinySdk as Abstraction } from "./abstractions.js";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";
import { EnvConfig } from "@webiny/app/features/envConfig";
import { TenantContext } from "~/features/tenancy/abstractions.js";

// Authenticated SDK singleton that configures the Webiny SDK with
// the API endpoint, current tenant, and a token provider that
// delegates to AuthenticationContext.getIdToken().
class WebinySdkImpl extends Webiny {
    constructor(
        authContext: AuthenticationContext.Interface,
        envConfig: EnvConfig.Interface,
        tenantContext: TenantContext.Interface
    ) {
        super({
            endpoint: envConfig.get("apiUrl"),
            tenant: tenantContext.getCurrentTenant() || "root",
            token: async () => {
                const token = await authContext.getIdToken();
                return token ?? "";
            }
        });
    }
}

export const WebinySdk = Abstraction.createImplementation({
    implementation: WebinySdkImpl,
    dependencies: [AuthenticationContext, EnvConfig, TenantContext]
});
