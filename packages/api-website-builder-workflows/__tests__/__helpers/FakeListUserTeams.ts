import { Result } from "@webiny/feature/api";
import type { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import type { Team } from "@webiny/api-core/types/security.js";

const createTeam = (id: string): Team => {
    return {
        id,
        name: id,
        slug: id,
        description: "",
        system: false,
        roles: [],
        createdOn: null,
        createdBy: null
    };
};

/** Team lookups from a fixed map of user id → team ids; unknown users have no teams. */
export class FakeListUserTeams implements ListUserTeamsUseCase.Interface {
    public constructor(private teamsByUser: Record<string, string[]>) {}

    public async execute(userId: string): Promise<Result<Team[], ListUserTeamsUseCase.Error>> {
        return Result.ok((this.teamsByUser[userId] ?? []).map(createTeam));
    }
}
