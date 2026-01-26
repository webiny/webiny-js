import { AuthenticationErrorEventHandler as EventHandler } from "webiny/admin/security";
import { TenantContext } from "webiny/admin/tenancy";
import { IdpRedirectGateway } from "./abstractions.js";

class AuthenticationErrorHandlerImpl implements EventHandler.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private redirectGateway: IdpRedirectGateway.Interface
    ) {}

    async handle(event: EventHandler.Event): Promise<void> {
        const { code, message } = event.payload;
        const tenantId = this.tenantContext.getCurrentTenant() ?? "root";

        console.warn(`Authentication error detected: ${code} - ${message}`);

        // Redirect to IDP login with error context
        this.redirectGateway.redirectToLogin(tenantId, code);
    }
}

export const AuthenticationErrorHandler = EventHandler.createImplementation({
    implementation: AuthenticationErrorHandlerImpl,
    dependencies: [TenantContext, IdpRedirectGateway]
});
