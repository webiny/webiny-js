import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowLookupError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface IWorkflowEditorAccessErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    lookup: WorkflowLookupError;
}

type WorkflowEditorAccessError = IWorkflowEditorAccessErrors[keyof IWorkflowEditorAccessErrors];

export interface IWorkflowEditorAccess {
    /**
     * Ok when the current identity is signed in and has `workflows.editor` (or full access).
     * `action` names what is refused in the not-authorized error, e.g. `list users`. A permission
     * load that throws is a lookup error.
     */
    check(action: string): Promise<Result<void, WorkflowEditorAccessError>>;
}

/**
 * The editor access check shared by the configuration use cases (D133 point 2, R97): a signed-in
 * identity with `workflows.editor`.
 */
export const WorkflowEditorAccess =
    createAbstraction<IWorkflowEditorAccess>("WorkflowEditorAccess");

export namespace WorkflowEditorAccess {
    export type Interface = IWorkflowEditorAccess;
    export type Error = WorkflowEditorAccessError;
    export type Return = Promise<Result<void, WorkflowEditorAccessError>>;
}
