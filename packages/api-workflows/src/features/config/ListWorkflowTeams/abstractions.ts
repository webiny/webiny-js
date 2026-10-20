import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowTeamList } from "~/domain/config/types.js";
import type {
    WorkflowPersistenceError,
    WorkflowValidationError
} from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface ListWorkflowTeamsInput {
    /** Case-insensitive substring of the team name; blank lists every team. */
    search?: string | null;
    /** Look these teams up instead, at most 200 distinct; `search` and `limit` are ignored. */
    ids?: string[] | null;
    /** Rows of a search: 50 by default, 1..200. */
    limit?: number | null;
}

export interface IListWorkflowTeamsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    validation: WorkflowValidationError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListWorkflowTeamsUseCaseErrors[keyof IListWorkflowTeamsUseCaseErrors];

export interface IListWorkflowTeamsUseCase {
    execute(input?: ListWorkflowTeamsInput): Promise<Result<WorkflowTeamList, UseCaseError>>;
}

/**
 * The tenant's teams for the workflow editor (Q42, R268): needs `workflows.editor`. Reads the
 * teams and the users' team memberships as the system (they need `security.team` and
 * `adminUsers.user`) and returns only id, name and member count. The shared `listTeams` GraphQL
 * operation calls this, never api-core directly.
 */
export const ListWorkflowTeamsUseCase = createAbstraction<IListWorkflowTeamsUseCase>(
    "ListWorkflowTeamsUseCase"
);

export namespace ListWorkflowTeamsUseCase {
    export type Interface = IListWorkflowTeamsUseCase;
    export type Input = ListWorkflowTeamsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowTeamList, UseCaseError>>;
}
