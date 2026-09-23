import { LogOutUseCase } from "~/features/security/LogOut/abstractions.js";
import { AssumedRoleContext } from "./abstractions.js";

/**
 * A preview belongs to the session that started it. Cleared before the rest of log out runs,
 * because the logout callback may navigate away and nothing after it is guaranteed to execute.
 */
class LogOutUseCaseDecoratorImpl implements LogOutUseCase.Interface {
    constructor(
        private assumedRoleContext: AssumedRoleContext.Interface,
        private decoratee: LogOutUseCase.Interface
    ) {}

    async execute(): Promise<void> {
        this.assumedRoleContext.set(null);
        await this.decoratee.execute();
    }
}

export const LogOutUseCaseDecorator = LogOutUseCase.createDecorator({
    decorator: LogOutUseCaseDecoratorImpl,
    dependencies: [AssumedRoleContext]
});
