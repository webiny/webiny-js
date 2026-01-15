import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { UpdateUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { updateUserValidation } from "./schema.js";
import { NotAuthorizedError, UserValidationError } from "~/features/users/shared/errors.js";
import { UserBeforeUpdateEvent, UserAfterUpdateEvent } from "./events.js";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { UpdateUserInput } from "~/features/users/shared/types.js";

class UpdateUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(
        id: string,
        input: UpdateUserInput
    ): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        // 1. Check permission
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        // 2. Validate input
        const validation = updateUserValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new UserValidationError(validation.error.errors[0].message));
        }

        // 3. Get existing user
        const getUserResult = await this.repository.get({ id });
        if (getUserResult.isFail()) {
            return Result.fail(getUserResult.error);
        }

        const originalUser = getUserResult.value;

        // 4. Clone update data for event modification
        const updateData = structuredClone(validation.data);

        // Immediately delete password from `updateData`, as that object will be merged with the `user` data.
        delete updateData["password"];

        // 5. Publish before event
        await this.eventPublisher.publish(
            new UserBeforeUpdateEvent({ user: originalUser, updateData, input: validation.data })
        );

        // 6. Merge updates with existing user
        const updatedUser: AdminUser = {
            ...originalUser,
            ...updateData
        };

        // 7. Update user via repository
        const result = await this.repository.update(updatedUser);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        // 8. Publish after event
        await this.eventPublisher.publish(
            new UserAfterUpdateEvent({
                originalUser,
                updatedUser: result.value,
                input: validation.data
            })
        );

        return Result.ok(result.value);
    }
}

export const UpdateUserUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: UpdateUserUseCaseImpl,
    dependencies: [IdentityContext, EventPublisher, AdminUsersRepository]
});
