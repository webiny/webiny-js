import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { UpdateUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { canAssignRolesAndTeams } from "~/features/security/utils/canAssignRolesAndTeams.js";
import { CANNOT_GRANT_PERMISSIONS_MESSAGE } from "~/features/security/utils/canGrantPermissions.js";
import { updateUserValidation } from "./schema.js";
import {
    NotAuthorizedError,
    EmailTakenError,
    UserValidationError
} from "~/features/users/shared/errors.js";
import { UserBeforeUpdateEvent, UserAfterUpdateEvent } from "./events.js";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { UpdateUserInput } from "~/features/users/shared/types.js";

class UpdateUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: AdminUsersRepository.Interface,
        private rolesRepository: RolesRepository.Interface,
        private teamsRepository: TeamsRepository.Interface
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
            return Result.fail(new UserValidationError(validation.error.issues[0].message));
        }

        // If the input contains email, check if it is free to use.
        if (input.email) {
            const existingUserResult = await this.repository.get({ email: input.email });
            if (existingUserResult.isOk()) {
                if (existingUserResult.value.id !== id) {
                    return Result.fail(new EmailTakenError(input.email));
                }
            }
        }
        // 3. Get existing user
        const getUserResult = await this.repository.get({ id });
        if (getUserResult.isFail()) {
            return Result.fail(getUserResult.error);
        }

        const originalUser = getUserResult.value;

        /**
         * Security: the caller may only assign roles and teams whose permissions they hold, and
         * may only manage a user whose current roles and teams they could assign (otherwise they
         * could, for example, change the password of a user with more access than they have).
         */
        const canAssign = await canAssignRolesAndTeams({
            identityContext: this.identityContext,
            rolesRepository: this.rolesRepository,
            teamsRepository: this.teamsRepository,
            roles: [...(originalUser.roles ?? []), ...(validation.data.roles ?? [])],
            teams: [...(originalUser.teams ?? []), ...(validation.data.teams ?? [])]
        });
        if (!canAssign) {
            return Result.fail(new NotAuthorizedError(CANNOT_GRANT_PERMISSIONS_MESSAGE));
        }

        // 4. Clone update data for event modification
        const updateData = structuredClone(validation.data);

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
    dependencies: [
        IdentityContext,
        EventPublisher,
        AdminUsersRepository,
        RolesRepository,
        TeamsRepository
    ]
});
