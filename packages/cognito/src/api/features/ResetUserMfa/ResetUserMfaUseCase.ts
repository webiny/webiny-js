import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { RolesRepository } from "@webiny/api-core/features/security/roles/shared/abstractions.js";
import { TeamsRepository } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import { canAssignRolesAndTeams } from "@webiny/api-core/features/security/utils/canAssignRolesAndTeams.js";
import { CANNOT_GRANT_PERMISSIONS_MESSAGE } from "@webiny/api-core/features/security/utils/canGrantPermissions.js";
import { ResetUserMfaUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";
import { CognitoExternalUserError, CognitoResetMfaError } from "~/api/domain/errors.js";
import { CognitoService } from "../CognitoService/abstractions.js";

class ResetUserMfaUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private cognitoService: CognitoService.Interface,
        private getUserUseCase: GetUserUseCase.Interface,
        private rolesRepository: RolesRepository.Interface,
        private teamsRepository: TeamsRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        const getUserResult = await this.getUserUseCase.execute({ id });
        if (getUserResult.isFail()) {
            return Result.fail(getUserResult.error);
        }

        const user = getUserResult.value;

        // A federated user signs in through their own identity provider, which handles their MFA.
        if (user.external) {
            return Result.fail(new CognitoExternalUserError(id));
        }

        // Security: the caller may only manage a user whose roles and teams they could assign
        // (same rule as updating or deleting a user).
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

        // Unlike changing a shared account's name, email or password, any administrator of one of
        // the person's tenants who may manage the user there may reset its MFA: the person can't
        // do it themselves when they can't sign in, and the reset doesn't give the administrator
        // access to the account.
        try {
            await this.cognitoService.resetMfa(Username.fromUser(user));

            return Result.ok();
        } catch (cognitoError) {
            return Result.fail(new CognitoResetMfaError(cognitoError as Error));
        }
    }
}

export const ResetUserMfaUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ResetUserMfaUseCaseImpl,
    dependencies: [
        IdentityContext,
        CognitoService,
        GetUserUseCase,
        RolesRepository,
        TeamsRepository
    ]
});
