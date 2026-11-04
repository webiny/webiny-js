import { Result } from "@webiny/feature/api";
import type { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ListTeamsInput } from "@webiny/api-core/features/security/teams/shared/types.js";
import { TeamStorageError } from "@webiny/api-core/features/security/teams/shared/errors.js";
import type { Team } from "@webiny/api-core/types/security.js";

export interface FakeTeam {
    id: string;
    name: string;
}

export interface ListTeamsCall {
    input: ListTeamsInput;
    /** Whether authorization was on during the call; `null` before `watch`. */
    authorizationEnabled: boolean | null;
}

/**
 * Teams from a fixed list, filtered by `id_in` like api-core does. Every team carries a slug, a
 * description and a role that the workflows list must never return. Records every call and fails
 * the next `failuresLeft` calls with a storage error. Register with
 * `container.registerInstance(ListTeamsUseCase, fake)` and call `watch` once the context exists.
 */
export class FakeListTeams implements ListTeamsUseCase.Interface {
    public readonly calls: ListTeamsCall[] = [];
    public failuresLeft = 0;
    private identityContext: IdentityContext.Interface | null = null;

    public constructor(private teams: FakeTeam[]) {}

    public watch(identityContext: IdentityContext.Interface): void {
        this.identityContext = identityContext;
    }

    public async execute(
        input: ListTeamsInput = {}
    ): Promise<Result<Team[], ListTeamsUseCase.Error>> {
        this.calls.push({
            input: structuredClone(input),
            authorizationEnabled: this.identityContext
                ? this.identityContext.isAuthorizationEnabled()
                : null
        });
        if (this.failuresLeft > 0) {
            this.failuresLeft -= 1;
            return Result.fail(new TeamStorageError(new Error("Storage is not available.")));
        }
        const where = input.where ?? {};
        const teams = this.teams.filter(team => {
            return !where.id_in || where.id_in.includes(team.id);
        });
        return Result.ok(
            teams.map(team => ({
                id: team.id,
                name: team.name,
                slug: `${team.id}-slug`,
                description: "Secret description",
                system: false,
                roles: ["role-secret"],
                createdOn: "2026-10-01T00:00:00.000Z",
                createdBy: null
            }))
        );
    }
}
