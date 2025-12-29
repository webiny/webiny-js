import { LogOutUseCase as UseCase } from "./abstractions.js";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";

class LogOutUseCaseImpl implements UseCase.Interface {
    constructor(
        private authContext: AuthenticationContext.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(): Promise<void> {
        this.identityContext.setIdentity(undefined);
        await this.authContext.logout();
    }
}

export const LogOutUseCase = UseCase.createImplementation({
    implementation: LogOutUseCaseImpl,
    dependencies: [AuthenticationContext, IdentityContext]
});
