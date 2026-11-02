import { Result } from "@webiny/feature/api";
import type { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { UserStorageError } from "@webiny/api-core/features/users/shared/errors.js";
import type { Team } from "@webiny/api-core/types/security.js";

export const createTeam = (id: string): Team => {
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

/**
 * Answers team lookups from a fixed map, records every asked user id, and fails the next
 * `failuresLeft` calls with a storage error.
 */
export class FakeListUserTeams implements ListUserTeamsUseCase.Interface {
    public readonly calls: string[] = [];
    public failuresLeft = 0;
    private readonly teamsByUser: Map<string, Team[]>;

    public constructor(teamsByUser: Map<string, Team[]> = new Map()) {
        this.teamsByUser = teamsByUser;
    }

    public async execute(userId: string): Promise<Result<Team[], ListUserTeamsUseCase.Error>> {
        this.calls.push(userId);
        if (this.failuresLeft > 0) {
            this.failuresLeft -= 1;
            return Result.fail(new UserStorageError(new Error("Storage is not available.")));
        }
        return Result.ok(this.teamsByUser.get(userId) ?? []);
    }
}
