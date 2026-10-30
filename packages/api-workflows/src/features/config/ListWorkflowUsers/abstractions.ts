import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowUserList } from "~/domain/config/types.js";
import type { WorkflowLookupError, WorkflowValidationError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface ListWorkflowUsersInput {
    /** Case-insensitive substring of the display name or the email; blank lists everyone. */
    search?: string | null;
    /**
     * Look these users up instead (D117), at most 200 distinct; `search`, `limit` and `teamIds`
     * are ignored, so a saved target who left the teams still resolves.
     */
    ids?: string[] | null;
    /**
     * Only users who are in at least one of these teams (R286). Empty matches no user. With
     * teams off a filter matches no user either. Null or absent is no filter.
     */
    teamIds?: string[] | null;
    /** Rows of a search: 50 by default, 1..200 (R92). */
    limit?: number | null;
}

export interface IListWorkflowUsersUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    validation: WorkflowValidationError;
    lookup: WorkflowLookupError;
}

type UseCaseError = IListWorkflowUsersUseCaseErrors[keyof IListWorkflowUsersUseCaseErrors];

export interface IListWorkflowUsersUseCase {
    execute(input?: ListWorkflowUsersInput): Promise<Result<WorkflowUserList, UseCaseError>>;
}

/**
 * The tenant's users for the workflow editor, the settings page and the request dialog (spec 10,
 * D48, D117, R123): needs `workflows.editor`. Reads users as the system (they need
 * `adminUsers.user`) and returns only id, display name and team ids (none while teams are off,
 * R286). The shared `listUsers` GraphQL operation calls this, never api-core directly.
 */
export const ListWorkflowUsersUseCase = createAbstraction<IListWorkflowUsersUseCase>(
    "ListWorkflowUsersUseCase"
);

export namespace ListWorkflowUsersUseCase {
    export type Interface = IListWorkflowUsersUseCase;
    export type Input = ListWorkflowUsersInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowUserList, UseCaseError>>;
}
