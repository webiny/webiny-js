import { AuthenticationErrorEvent, AuthenticationErrorEventHandler } from "@webiny/app/errors";
import { TenantContext } from "webiny/admin/tenancy";
import { IdpRedirectGateway } from "./abstractions.js";

class CustomIdpAuthenticationErrorHandlerImpl implements AuthenticationErrorEventHandler.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private redirectGateway: IdpRedirectGateway.Interface
    ) {}

    async handle(event: AuthenticationErrorEvent): Promise<void> {
        const { code, message } = event.payload;
        const tenantId = this.tenantContext.getCurrentTenant() ?? "root";

        console.warn(`Authentication error detected: ${code} - ${message}`);

        // Redirect to IDP login with error context
        this.redirectGateway.redirectToLogin(tenantId, code);
    }
}

export const CustomIdpAuthenticationErrorHandler =
    AuthenticationErrorEventHandler.createImplementation({
        implementation: CustomIdpAuthenticationErrorHandlerImpl,
        dependencies: [TenantContext, IdpRedirectGateway]
    });
