import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-security/features/IdentityContext";
import { ListTeamsUseCase } from "@webiny/api-security/features/teams/ListTeams";
import { ListUserTeamsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/shared/abstractions.js";
import type { Team } from "@webiny/api-security/types.js";

class ListUserTeamsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: AdminUsersRepository.Interface,
        private listTeamsUseCase: ListTeamsUseCase.Interface
    ) {}

    async execute(userId: string): Promise<Result<Team[], UseCaseAbstraction.Error>> {
        // No authorization check - runs without authorization as per original implementation
        return this.identityContext.withoutAuthorization(async () => {
            // 1. Get the user
            const getUserResult = await this.repository.get({ id: userId });
            if (getUserResult.isFail()) {
                return Result.fail(getUserResult.error);
            }

            const adminUser = getUserResult.value;

            // 2. Check if user has teams
            if (!adminUser.teams || adminUser.teams.length === 0) {
                return Result.ok([]);
            }

            // 3. List teams using ListTeamsUseCase
            const listTeamsResult = await this.listTeamsUseCase.execute({
                where: {
                    id_in: adminUser.teams
                }
            });

            if (listTeamsResult.isFail()) {
                // Return empty array on error (original behavior)
                return Result.ok([]);
            }

            return Result.ok(listTeamsResult.value);
        });
    }
}

export const ListUserTeamsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListUserTeamsUseCaseImpl,
    dependencies: [IdentityContext, AdminUsersRepository, ListTeamsUseCase]
});
