import { BaseError } from "@webiny/feature/api";
import type { IWorkflowStateRecord, IWorkflowStateRecordStep } from "./abstractions.js";

export class WorkflowStateNotFoundError extends BaseError<{
    id?: string;
    app?: string;
    targetRevisionId?: string;
}> {
    override readonly code = "Workflows/State/NotFound" as const;

    constructor(data: { id?: string; app?: string; targetRevisionId?: string }) {
        super({
            message: "Workflow state not found",
            data
        });
    }
}

export class WorkflowStateNotAuthorizedError extends BaseError {
    override readonly code = "Workflows/State/NotAuthorized" as const;

    constructor(message: string) {
        super({ message });
    }
}

export class WorkflowStatePersistenceError extends BaseError {
    override readonly code = "Workflows/State/Persistence" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}

export class WorkflowStateValidationError extends BaseError {
    override readonly code = "Workflows/State/Validation" as const;

    constructor(message: string) {
        super({ message });
    }
}

export class ActiveStateExistsError extends BaseError<{ app: string; targetRevisionId: string }> {
    override readonly code = "Workflows/State/ActiveExists" as const;

    constructor(data: { app: string; targetRevisionId: string }) {
        super({
            message: "An active workflow state already exists for this target",
            data
        });
    }
}

export class MultipleWorkflowsFoundError extends BaseError {
    override readonly code = "Workflows/State/MultipleFound" as const;

    constructor(data: any) {
        super({
            message: "Multiple workflows found when only one was expected",
            data
        });
    }
}

export class WorkflowStateNoPendingStepError extends BaseError {
    override readonly code = "Workflows/State/NoPendingStep" as const;

    constructor() {
        super({
            message: "No pending step found in workflow state"
        });
    }
}

export class WorkflowStateStepCannotReviewError extends BaseError<{
    step: IWorkflowStateRecordStep;
}> {
    override readonly code = "Workflows/State/Step/CannotReview" as const;

    constructor(step: IWorkflowStateRecordStep) {
        super({
            message: "You do not have permissions to review this workflow state step.",
            data: { step }
        });
    }
}

export class WorkflowStateStepCannotTakeOverError extends BaseError<{
    step: IWorkflowStateRecordStep;
}> {
    override readonly code = "Workflows/State/Step/CannotTakeOver" as const;

    constructor(step: IWorkflowStateRecordStep) {
        super({
            message: "You do not have permissions to take over this workflow state step.",
            data: { step }
        });
    }
}

export class WorkflowStateStepNotStepOwnerError extends BaseError<{
    step: IWorkflowStateRecordStep;
}> {
    override readonly code = "Workflows/State/Step/NotStepOwner" as const;

    constructor(step: IWorkflowStateRecordStep) {
        super({
            message: "You must be the owner of this workflow state step to perform this action.",
            data: { step }
        });
    }
}

export class WorkflowStateInReviewError extends BaseError<{ state: IWorkflowStateRecord }> {
    override readonly code = "Workflows/State/InReview" as const;

    constructor(state: IWorkflowStateRecord) {
        super({
            message: "The workflow state is already in review and cannot proceed.",
            data: { state }
        });
    }
}

export class WorkflowStateRejectedError extends BaseError<{ state: IWorkflowStateRecord }> {
    override readonly code = "Workflows/State/Rejected" as const;

    constructor(state: IWorkflowStateRecord) {
        super({
            message: "Cannot perform this action on a workflow state that has been rejected.",
            data: { state }
        });
    }
}

export class WorkflowStateNotInReview extends BaseError<{ state: IWorkflowStateRecord }> {
    override readonly code = "Workflows/State/NotInReview" as const;

    constructor(message: string, state: IWorkflowStateRecord) {
        super({
            message,
            data: { state }
        });
    }
}

export class WorkflowStateNoCurrentStepError extends BaseError<{
    steps: IWorkflowStateRecordStep[];
}> {
    override readonly code = "Workflows/State/NoCurrentStep" as const;

    constructor(steps: IWorkflowStateRecordStep[]) {
        super({
            message: "Cannot determine the current step of the workflow state.",
            data: { steps }
        });
    }
}
