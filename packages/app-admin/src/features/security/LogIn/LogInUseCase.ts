import { LogInRepository, LogInUseCase as UseCase } from "./abstractions.js";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { hasAppPermissions } from "./hasAppPermissions.js";

class LoginUseCaseImpl implements UseCase.Interface {
    constructor(
        private authContext: AuthenticationContext.Interface,
        private identityContext: IdentityContext.Interface,
        private logInRepository: LogInRepository.Interface
    ) {}

    async execute(params: UseCase.Params): Promise<void> {
        // 1. Set authentication providers
        this.authContext.setIdTokenProvider(params.idTokenProvider);
        if (params.logoutCallback) {
            this.authContext.setLogoutCallback(params.logoutCallback);
        }

        // TODO: if it's a multi-tenant system, and current tenant is not known (no URL param, no localStorage),
        // execute the GET_DEFAULT_TENANT query to first determine the tenant. Only then login the user.

        const identity = await this.logInRepository.login();

        // 3. Ensure identity has some permissions
        if (!hasAppPermissions(identity)) {
            throw new Error("You have no permissions on this tenant!");
        }

        // 4. Set identity (user is now "logged in")
        this.identityContext.setIdentity(identity);
    }
}

export const LogInUseCase = UseCase.createImplementation({
    implementation: LoginUseCaseImpl,
    dependencies: [AuthenticationContext, IdentityContext, LogInRepository]
});
