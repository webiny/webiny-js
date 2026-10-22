import { LogInRepository, LogInUseCase as UseCase } from "./abstractions.js";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { LoginTenantResolver } from "~/features/security/LoginTenantResolver/index.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";
import type { Identity } from "~/domain/Identity.js";
import { LogInError } from "./LogInError.js";

class LoginUseCaseImpl implements UseCase.Interface {
    constructor(
        private authContext: AuthenticationContext.Interface,
        private identityContext: IdentityContext.Interface,
        private logInRepository: LogInRepository.Interface,
        private tenantResolver: LoginTenantResolver.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async execute(params: UseCase.Params): Promise<UseCase.Result> {
        // 1. Set authentication providers
        this.authContext.setIdTokenProvider(params.idTokenProvider);
        if (params.logoutCallback) {
            this.authContext.setLogoutCallback(params.logoutCallback);
        }

        // 2. Log in on the current tenant. If the user can't, find the tenant they can log into.
        let identity: Identity;
        try {
            identity = await this.logInRepository.login();
        } catch (error) {
            return this.resolveTenant(LogInError.from(error));
        }

        // 3. Ensure identity has some permissions
        this.validatePermissions(identity.getPermissions());

        // 4. Set identity (user is now "logged in")
        this.identityContext.setIdentity(identity);

        return { type: "loggedIn" };
    }

    private async resolveTenant(error: LogInError): Promise<UseCase.Result> {
        const resolution = await this.tenantResolver.resolve(error);

        switch (resolution.type) {
            case "switchTenant":
                // Setting the current tenant again changes nothing and would leave the login pending.
                if (resolution.tenantId === this.tenantContext.getCurrentTenant()) {
                    throw error;
                }
                // Changing the tenant reloads the app, which logs in again on the new tenant.
                this.tenantContext.setTenant(resolution.tenantId);
                return { type: "switchingTenant", tenantId: resolution.tenantId };
            case "selectTenant":
                return { type: "selectTenant", tenants: resolution.tenants };
            case "noTenantAccess":
                return { type: "noTenantAccess" };
            default:
                throw error;
        }
    }

    private validatePermissions = (permissions: Identity.Permission[]) => {
        const appPermissions = permissions.filter(p => p.name !== "aacl");
        if (appPermissions.length === 0) {
            throw new Error("You have no permissions on this tenant!");
        }
    };
}

export const LogInUseCase = UseCase.createImplementation({
    implementation: LoginUseCaseImpl,
    dependencies: [
        AuthenticationContext,
        IdentityContext,
        LogInRepository,
        LoginTenantResolver,
        TenantContext
    ]
});
