import { Result } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { Team } from "@webiny/api-core/types/security.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { DEFAULT_TEAM_LIST_LIMIT } from "~/constants.js";
import { MAX_TEAM_LIST_LIMIT } from "~/constants.js";
import { TEAMS_FEATURE_FLAG } from "~/constants.js";
import type { WorkflowTeamSummary } from "~/domain/config/types.js";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError, WorkflowValidationError } from "~/domain/workflow/errors.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowTeamsUseCase as UseCase } from "./abstractions.js";

const compareTeams = (a: Team, b: Team): number => {
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
};

/** Counts, for each team, the users whose `teams` contain it. A team with no user is 0. */
const toWorkflowTeams = (teams: Team[], users: AdminUser[]): WorkflowTeamSummary[] => {
    const counts = new Map<string, number>();
    for (const team of teams) {
        counts.set(team.id, 0);
    }
    for (const user of users) {
        for (const teamId of user.teams ?? []) {
            const count = counts.get(teamId);
            if (count !== undefined) {
                counts.set(teamId, count + 1);
            }
        }
    }
    return teams.map(team => {
        return { id: team.id, name: team.name, memberCount: counts.get(team.id) ?? 0 };
    });
};

class ListWorkflowTeamsUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private featureFlags: FeatureFlags.Interface,
        private identityContext: IdentityContext.Interface,
        private listTeams: ListTeamsUseCase.Interface,
        private listUsers: ListUsersUseCase.Interface
    ) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list teams" }));
        }

        const ids = input.ids ? [...new Set(input.ids)] : null;
        if (ids && ids.length === 0) {
            return Result.ok({ teams: [], missingIds: [] });
        }
        // Counted after de-duplication, the number of ids the lookup asks for.
        if (ids && ids.length > MAX_TEAM_LIST_LIMIT) {
            return Result.fail(new WorkflowValidationError("Too many team ids."));
        }

        // R287, R290: read again on every request. With teams off nothing is queried and the
        // editor gets an empty list.
        let teamsEnabled: boolean;
        try {
            teamsEnabled = this.featureFlags.get().isEnabled(TEAMS_FEATURE_FLAG);
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        if (!teamsEnabled) {
            return Result.ok({ teams: [], missingIds: [] });
        }

        // A name lookup, not an access decision: `ListTeams` needs `security.team`.
        let listedTeams: Result<Team[], ListTeamsUseCase.Error>;
        try {
            listedTeams = await this.identityContext.withoutAuthorization(() => {
                return this.listTeams.execute(ids ? { where: { id_in: ids } } : {});
            });
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        if (listedTeams.isFail()) {
            return Result.fail(new WorkflowPersistenceError(listedTeams.error));
        }

        const teams: Team[] = [];
        const missingIds: string[] = [];
        if (ids) {
            const byId = new Map(listedTeams.value.map(team => [team.id, team]));
            for (const id of ids) {
                const team = byId.get(id);
                if (team) {
                    teams.push(team);
                } else {
                    missingIds.push(id);
                }
            }
        } else {
            // A missing or non-finite limit takes the default; others round down into 1..200.
            const requestedLimit =
                typeof input.limit === "number" && Number.isFinite(input.limit)
                    ? Math.floor(input.limit)
                    : DEFAULT_TEAM_LIST_LIMIT;
            const limit = Math.min(Math.max(requestedLimit, 1), MAX_TEAM_LIST_LIMIT);

            const term = input.search?.trim().toLowerCase() ?? "";
            const found = listedTeams.value
                .filter(team => !term || team.name.toLowerCase().includes(term))
                .sort(compareTeams)
                .slice(0, limit);
            teams.push(...found);
        }

        if (teams.length === 0) {
            return Result.ok({ teams: [], missingIds });
        }

        // The member count: one scan of the tenant's users, which carry their team ids. A
        // membership count, not an access decision: `ListUsers` needs `adminUsers.user`.
        const teamIds = teams.map(team => team.id);
        let listedUsers: Result<AdminUser[], ListUsersUseCase.Error>;
        try {
            listedUsers = await this.identityContext.withoutAuthorization(() => {
                return this.listUsers.execute({ where: { teams_in: teamIds } });
            });
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        if (listedUsers.isFail()) {
            return Result.fail(new WorkflowPersistenceError(listedUsers.error));
        }

        return Result.ok({ teams: toWorkflowTeams(teams, listedUsers.value), missingIds });
    }
}

export const ListWorkflowTeamsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowTeamsUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        FeatureFlags,
        IdentityContext,
        ListTeamsUseCase,
        ListUsersUseCase
    ]
});
