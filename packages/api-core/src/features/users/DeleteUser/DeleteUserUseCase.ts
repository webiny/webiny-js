import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { DeleteUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { canAssignRolesAndTeams } from "~/features/security/utils/canAssignRolesAndTeams.js";
import { CANNOT_GRANT_PERMISSIONS_MESSAGE } from "~/features/security/utils/canGrantPermissions.js";
import { NotAuthorizedError } from "~/features/users/shared/errors.js";
import { UserBeforeDeleteEvent, UserAfterDeleteEvent } from "./events.js";
import { CannotDeleteOwnAccountError } from "./errors.js";

class DeleteUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: AdminUsersRepository.Interface,
        private rolesRepository: RolesRepository.Interface,
        private teamsRepository: TeamsRepository.Interface
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

        /**
         * Security: the caller may only delete a user whose roles and teams they could assign
         * (same rule as updating a user). Otherwise they could remove a user with more access
         * than they have.
         */
        const canAssign = await canAssignRolesAndTeams({
            identityContext: this.identityContext,
            rolesRepository: this.rolesRepository,
            teamsRepository: this.teamsRepository,
            roles: user.roles ?? [],
            teams: user.teams ?? []
        });
        if (!canAssign) {
            return Result.fail(new NotAuthorizedError(CANNOT_GRANT_PERMISSIONS_MESSAGE));
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
    dependencies: [
        IdentityContext,
        EventPublisher,
        AdminUsersRepository,
        RolesRepository,
        TeamsRepository
    ]
});
