import { Result } from "@webiny/feature/api";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams";
import { GetUserTeamsUseCase as UseCase } from "./abstractions.js";
import type { IWorkflowStepTeam } from "~/domain/workflow/abstractions.js";

class GetUserTeamsUseCaseImpl implements UseCase.Interface {
    private cache = new Map<string, IWorkflowStepTeam[]>();

    constructor(private listUserTeams: ListUserTeamsUseCase.Interface) {}

    async execute(userId: string): UseCase.Return {
        // Check cache first
        const cached = this.cache.get(userId);
        if (cached) {
            return Result.ok(cached);
        }

        // Fetch teams
        const result = await this.listUserTeams.execute(userId);

        if (result.isFail()) {
            // If fetching teams fails, return an empty array (user has no teams)
            return Result.ok([]);
        }

        const teams = result.value.map(team => ({ id: team.id }));

        // Cache the result
        this.cache.set(userId, teams);

        return Result.ok(teams);
    }
}

export const GetUserTeamsUseCase = UseCase.createImplementation({
    implementation: GetUserTeamsUseCaseImpl,
    dependencies: [ListUserTeamsUseCase]
});
