import { BaseError } from "@webiny/feature/api";

/** Workflow actions need a signed-in identity; returned to app wrappers by `CurrentReviewViewer`. */
export class WorkflowsNotAuthenticatedError extends BaseError {
    override readonly code = "Workflows/NotAuthenticated" as const;

    constructor() {
        super({ message: "You must be signed in to use workflows." });
    }
}

export interface WorkflowsNotAuthorizedErrorData {
    /** What was refused, e.g. `cancel`. */
    action: string;
}

/** Shared by the app wrappers when a workflows permission or target access check refuses an action. */
export class WorkflowsNotAuthorizedError extends BaseError<WorkflowsNotAuthorizedErrorData> {
    override readonly code = "Workflows/NotAuthorized" as const;

    constructor(data: WorkflowsNotAuthorizedErrorData) {
        super({ message: `You are not allowed to ${data.action}.`, data });
    }
}
