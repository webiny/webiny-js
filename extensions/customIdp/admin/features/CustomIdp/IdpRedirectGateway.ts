import { IdpRedirectGateway as Abstraction, CustomIdpConfig } from "./abstractions.js";

class IdpRedirectGatewayImpl implements Abstraction.Interface {
    constructor(private config: CustomIdpConfig.Interface) {}

    redirectToLogin(tenantId: string, error?: string): void {
        const url = new URL(this.config.loginUrl);
        url.searchParams.set("tenantId", tenantId);
        if (error) {
            url.searchParams.set("error", error);
        }
        window.location.href = url.toString();
    }
}

export const IdpRedirectGateway = Abstraction.createImplementation({
    implementation: IdpRedirectGatewayImpl,
    dependencies: [CustomIdpConfig]
});
