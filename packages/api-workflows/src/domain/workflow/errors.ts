import { BaseError } from "@webiny/feature/api";
import type { PersistenceErrorSource } from "../PersistenceErrorSource.js";
import type { WorkflowIdentity } from "./types.js";

export interface WorkflowNotFoundErrorData {
    id: string;
}

export class WorkflowNotFoundError extends BaseError<WorkflowNotFoundErrorData> {
    override readonly code = "Workflows/Workflow/NotFound" as const;

    constructor(data: WorkflowNotFoundErrorData) {
        super({
            message: `Workflow "${data.id}" was not found.`,
            data
        });
    }
}

export interface WorkflowConflictErrorData {
    savedOn: string;
    savedBy: WorkflowIdentity;
}

/** The stored workflow changed after the caller loaded it (D131). */
export class WorkflowConflictError extends BaseError<WorkflowConflictErrorData> {
    override readonly code = "Workflows/Workflow/Conflict" as const;

    constructor(data: WorkflowConflictErrorData) {
        super({
            message: `The workflow was changed by ${data.savedBy.displayName} on ${data.savedOn}. Reload it to see the latest version.`,
            data
        });
    }
}

export class WorkflowValidationError extends BaseError {
    override readonly code = "Workflows/Workflow/Validation" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}

/** Duck-typed so errors thrown by handlers in other packages are recognised. */
export const isWorkflowValidationError = (error: unknown): error is WorkflowValidationError => {
    return (
        error instanceof Error &&
        (error as Partial<WorkflowValidationError>).code === "Workflows/Workflow/Validation"
    );
};

export interface WorkflowPersistenceErrorCause {
    code?: string;
    message: string;
}

export interface WorkflowPersistenceErrorData {
    cause: WorkflowPersistenceErrorCause;
}

export class WorkflowPersistenceError extends BaseError<WorkflowPersistenceErrorData> {
    override readonly code = "Workflows/Workflow/Persistence" as const;

    constructor(error: PersistenceErrorSource) {
        super({
            message: error.message,
            data: { cause: { code: error.code, message: error.message } }
        });
    }
}

export interface WorkflowHasActiveReviewsErrorData {
    count: number;
}

/** D81. Phase 3 adds up to 5 readable blocking reviews to the data (D115). */
export class WorkflowHasActiveReviewsError extends BaseError<WorkflowHasActiveReviewsErrorData> {
    override readonly code = "Workflows/Workflow/HasActiveReviews" as const;

    constructor(data: WorkflowHasActiveReviewsErrorData) {
        super({
            message: `The workflow cannot be deleted while ${data.count} review(s) are in progress.`,
            data
        });
    }
}
