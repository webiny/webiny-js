import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-security/features/IdentityContext";
import { EventPublisher } from "@webiny/api-core";
import { DeleteUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/shared/abstractions.js";
import { NotAuthorizedError } from "~/features/shared/errors.js";
import { UserBeforeDeleteEvent, UserAfterDeleteEvent } from "./events.js";
import { CannotDeleteOwnAccountError } from "./errors.js";

class DeleteUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        // 1. Check permission
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        // 2. Get existing user
        const getUserResult = await this.repository.get({ id });
        if (getUserResult.isFail()) {
            return Result.fail(getUserResult.error);
        }

        const user = getUserResult.value;

        // 3. Check if trying to delete own account
        const identity = this.identityContext.getIdentity();
        if (user.id === identity.id) {
            return Result.fail(new CannotDeleteOwnAccountError());
        }

        // 4. Publish before event
        await this.eventPublisher.publish(new UserBeforeDeleteEvent({ user }));

        // 5. Delete user via repository
        const result = await this.repository.delete(user);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        // 6. Publish after event
        await this.eventPublisher.publish(new UserAfterDeleteEvent({ user }));

        return Result.ok();
    }
}

export const DeleteUserUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteUserUseCaseImpl,
    dependencies: [IdentityContext, EventPublisher, AdminUsersRepository]
});
