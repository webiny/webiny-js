import { Result } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { ListUsersInput } from "@webiny/api-core/features/users/shared/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { DEFAULT_USER_LIST_LIMIT } from "~/constants.js";
import { MAX_USER_LIST_LIMIT } from "~/constants.js";
import { TEAMS_FEATURE_FLAG } from "~/constants.js";
import type { WorkflowListedUser } from "~/domain/config/types.js";
import { WorkflowLookupError, WorkflowValidationError } from "~/domain/workflow/errors.js";
import { WorkflowEditorAccess } from "~/features/permissions/WorkflowEditorAccess/index.js";
import { ListWorkflowUsersUseCase as UseCase } from "./abstractions.js";

/** The team ids are the user's own list, and only while teams are on (R286). */
const toListedUser = (user: AdminUser, teamsEnabled: boolean): WorkflowListedUser => {
    const teamIds = teamsEnabled ? [...(user.teams ?? [])] : [];
    return { id: user.id, displayName: user.displayName, teamIds };
};

class ListWorkflowUsersUseCaseImpl implements UseCase.Interface {
    constructor(
        private editorAccess: WorkflowEditorAccess.Interface,
        private featureFlags: FeatureFlags.Interface,
        private identityContext: IdentityContext.Interface,
        private listUsers: ListUsersUseCase.Interface
    ) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
        const access = await this.editorAccess.check("list users");
        if (access.isFail()) {
            return Result.fail(access.error);
        }

        const ids = input.ids ? [...new Set(input.ids)] : null;
        if (ids && ids.length === 0) {
            return Result.ok({ users: [], missingIds: [] });
        }
        // R126: counted after de-duplication, the number of ids the lookup asks for.
        if (ids && ids.length > MAX_USER_LIST_LIMIT) {
            return Result.fail(new WorkflowValidationError("Too many user ids."));
        }

        // R287: read again on every request, never cached at registration.
        let teamsEnabled: boolean;
        try {
            teamsEnabled = this.featureFlags.get().isEnabled(TEAMS_FEATURE_FLAG);
        } catch (error) {
            return Result.fail(
                new WorkflowLookupError(error instanceof Error ? error : new Error(String(error)))
            );
        }

        // R286: an ids lookup ignores the team filter. An empty filter, or a filter while teams
        // are off, matches no user, so there is nothing to look up.
        const teamIds = !ids && input.teamIds ? [...new Set(input.teamIds)] : null;
        if (teamIds && (!teamsEnabled || teamIds.length === 0)) {
            return Result.ok({ users: [], missingIds: [] });
        }

        const listInput: ListUsersInput = {};
        if (ids) {
            listInput.where = { id_in: ids };
        }
        if (teamIds) {
            listInput.where = { teams_in: teamIds };
        }

        // A membership lookup, not an access decision: `ListUsers` needs `adminUsers.user` (D48).
        let listed: Result<AdminUser[], ListUsersUseCase.Error>;
        try {
            listed = await this.identityContext.withoutAuthorization(() => {
                return this.listUsers.execute(listInput);
            });
        } catch (error) {
            return Result.fail(
                new WorkflowLookupError(error instanceof Error ? error : new Error(String(error)))
            );
        }
        if (listed.isFail()) {
            return Result.fail(new WorkflowLookupError(listed.error));
        }

        if (ids) {
            const byId = new Map(listed.value.map(user => [user.id, user]));
            const users: WorkflowListedUser[] = [];
            const missingIds: string[] = [];
            for (const id of ids) {
                const user = byId.get(id);
                if (user) {
                    users.push(toListedUser(user, teamsEnabled));
                } else {
                    missingIds.push(id);
                }
            }
            return Result.ok({ users, missingIds });
        }

        // A missing or non-finite limit takes the default; others round down into 1..200 (R92).
        const requestedLimit =
            typeof input.limit === "number" && Number.isFinite(input.limit)
                ? Math.floor(input.limit)
                : DEFAULT_USER_LIST_LIMIT;
        const limit = Math.min(Math.max(requestedLimit, 1), MAX_USER_LIST_LIMIT);

        const term = input.search?.trim().toLowerCase() ?? "";
        const users = listed.value
            .filter(user => {
                if (!term) {
                    return true;
                }
                return (
                    user.displayName.toLowerCase().includes(term) ||
                    user.email.toLowerCase().includes(term)
                );
            })
            .sort((a, b) => {
                return a.displayName.localeCompare(b.displayName) || a.id.localeCompare(b.id);
            })
            .slice(0, limit)
            .map(user => toListedUser(user, teamsEnabled));
        return Result.ok({ users, missingIds: [] });
    }
}

export const ListWorkflowUsersUseCase = UseCase.createImplementation({
    implementation: ListWorkflowUsersUseCaseImpl,
    dependencies: [WorkflowEditorAccess, FeatureFlags, IdentityContext, ListUsersUseCase]
});
