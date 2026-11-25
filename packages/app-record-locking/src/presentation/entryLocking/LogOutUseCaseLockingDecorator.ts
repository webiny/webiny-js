import { LogOutUseCase } from "@webiny/app-admin/features/security/LogOut/abstractions.js";
import { RecordLockingPresenter } from "./abstractions.js";

/**
 * The lock is released before log out runs: once the identity and token are cleared, the unlock
 * request can no longer be authorized. A failed release must never block signing out.
 */
class LogOutUseCaseLockingDecoratorImpl implements LogOutUseCase.Interface {
    constructor(
        private presenter: RecordLockingPresenter.Interface,
        private decoratee: LogOutUseCase.Interface
    ) {}

    async execute(): Promise<void> {
        try {
            await this.presenter.release();
        } catch {
            // Sign out regardless.
        }

        await this.decoratee.execute();
    }
}

export const LogOutUseCaseLockingDecorator = LogOutUseCase.createDecorator({
    decorator: LogOutUseCaseLockingDecoratorImpl,
    dependencies: [RecordLockingPresenter]
});
