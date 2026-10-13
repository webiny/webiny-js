import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { DEFAULT_USER_LIST_LIMIT, MAX_USER_LIST_LIMIT } from "~/constants.js";
import type { WorkflowUser } from "~/domain/config/types.js";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError, WorkflowValidationError } from "~/domain/workflow/errors.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowUsersUseCase as UseCase } from "./abstractions.js";

const toWorkflowUser = (user: AdminUser): WorkflowUser => {
    return { id: user.id, displayName: user.displayName };
};

class ListWorkflowUsersUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private identityContext: IdentityContext.Interface,
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
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list users" }));
        }

        const ids = input.ids ? [...new Set(input.ids)] : null;
        if (ids && ids.length === 0) {
            return Result.ok({ users: [], missingIds: [] });
        }
        // R126: counted after de-duplication, the number of ids the lookup asks for.
        if (ids && ids.length > MAX_USER_LIST_LIMIT) {
            return Result.fail(new WorkflowValidationError("Too many user ids."));
        }

        // A membership lookup, not an access decision: `ListUsers` needs `adminUsers.user` (D48).
        let listed: Result<AdminUser[], ListUsersUseCase.Error>;
        try {
            listed = await this.identityContext.withoutAuthorization(() => {
                return this.listUsers.execute(ids ? { where: { id_in: ids } } : {});
            });
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (listed.isFail()) {
            return Result.fail(new WorkflowPersistenceError(listed.error));
        }

        if (ids) {
            const byId = new Map(listed.value.map(user => [user.id, user]));
            const users: WorkflowUser[] = [];
            const missingIds: string[] = [];
            for (const id of ids) {
                const user = byId.get(id);
                if (user) {
                    users.push(toWorkflowUser(user));
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
            .map(toWorkflowUser);
        return Result.ok({ users, missingIds: [] });
    }
}

export const ListWorkflowUsersUseCase = UseCase.createImplementation({
    implementation: ListWorkflowUsersUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, IdentityContext, ListUsersUseCase]
});
