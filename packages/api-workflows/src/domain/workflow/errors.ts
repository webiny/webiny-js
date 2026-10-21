import { BaseError } from "@webiny/feature/api";
import type { PersistenceErrorSource } from "../PersistenceErrorSource.js";
import { PersistenceError } from "~/domain/PersistenceError.js";
import type { WorkflowBlockingReview, WorkflowIdentity } from "./types.js";

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

/**
 * Where a validation problem is (R267, R288). `stepId` is null for a problem of the whole
 * workflow; `field` is null when no field can be named; `workflowId` is the other workflow of the
 * duplicate-model error; `ruleId` is the routing rule of a rule-level failure, null otherwise.
 */
export interface WorkflowValidationErrorData {
    stepId: string | null;
    field: string | null;
    workflowId: string | null;
    ruleId: string | null;
}

export class WorkflowValidationError extends BaseError<WorkflowValidationErrorData> {
    override readonly code = "Workflows/Workflow/Validation" as const;

    constructor(message: string, where: Partial<WorkflowValidationErrorData> = {}) {
        super({
            message,
            data: {
                stepId: where.stepId ?? null,
                field: where.field ?? null,
                workflowId: where.workflowId ?? null,
                ruleId: where.ruleId ?? null
            }
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

export class WorkflowPersistenceError extends PersistenceError {
    override readonly code = "Workflows/Workflow/Persistence" as const;

    constructor(error: PersistenceErrorSource) {
        super("The workflow could not be read or saved.", error);
    }
}

export interface WorkflowHasActiveReviewsErrorData {
    /** Exact number of in-progress reviews, regardless of what the caller can read (D115). */
    count: number;
    /** The engine returns every blocking review; app wrappers keep the first 5 readable (R57). */
    reviews: WorkflowBlockingReview[];
}

/** D81, D115. */
export class WorkflowHasActiveReviewsError extends BaseError<WorkflowHasActiveReviewsErrorData> {
    override readonly code = "Workflows/Workflow/HasActiveReviews" as const;

    constructor(data: WorkflowHasActiveReviewsErrorData) {
        super({
            message: `The workflow cannot be deleted while ${data.count} review(s) are in progress.`,
            data
        });
    }
}
