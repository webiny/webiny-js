import { LogOutUseCase } from "~/features/security/LogOut/abstractions.js";
import { AssumePermissionsContext } from "./abstractions.js";

/**
 * A preview belongs to the session that started it. Cleared before the rest of log out runs,
 * because the logout callback may navigate away and nothing after it is guaranteed to execute.
 */
class LogOutUseCaseDecoratorImpl implements LogOutUseCase.Interface {
    constructor(
        private assumePermissionsContext: AssumePermissionsContext.Interface,
        private decoratee: LogOutUseCase.Interface
    ) {}

    async execute(): Promise<void> {
        this.assumePermissionsContext.set(null);
        await this.decoratee.execute();
    }
}

export const LogOutUseCaseDecorator = LogOutUseCase.createDecorator({
    decorator: LogOutUseCaseDecoratorImpl,
    dependencies: [AssumePermissionsContext]
});
