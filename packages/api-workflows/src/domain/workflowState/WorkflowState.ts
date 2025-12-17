import type {
    IWorkflowState,
    IWorkflowStateRecord,
    IWorkflowStateIdentity,
    IEnrichedWorkflowStateRecordStep,
    IWorkflowStateRecordStep
} from "./abstractions.js";
import { WorkflowStateRecordState } from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import type { IWorkflowStepTeam } from "../workflow/abstractions.js";
import {
    WorkflowStateNotAuthorizedError,
    WorkflowStateNoPendingStepError,
    WorkflowStateStepCannotReviewError,
    WorkflowStateStepCannotTakeOverError,
    WorkflowStateStepNotStepOwnerError,
    WorkflowStateInReviewError,
    WorkflowStateRejectedError,
    WorkflowStateNoCurrentStepError
} from "./errors.js";
import { canReview } from "./guards/canReview.js";
import { isRejected } from "./guards/isRejected.js";
import { canTakeOver } from "./guards/canTakeOver.js";
import { isInReview } from "./guards/isInReview.js";
import { isStepOwner } from "./guards/isStepOwner.js";

interface IEnrichStepWithPermissionParams {
    createdBy: Pick<IWorkflowStateIdentity, "id">;
    step: IWorkflowStateRecordStep;
}

export class WorkflowState implements IWorkflowState {
    constructor(
        private record: IWorkflowStateRecord,
        private teams: IWorkflowStepTeam[],
        private currentIdentity: IWorkflowStateIdentity
    ) {}

    get id() {
        return this.record.id;
    }

    get app() {
        return this.record.app;
    }

    get title() {
        return this.record.title;
    }

    get workflowId() {
        return this.record.workflowId;
    }

    get targetId() {
        return this.record.targetId;
    }

    get targetRevisionId() {
        return this.record.targetRevisionId;
    }

    get isActive() {
        return this.record.isActive;
    }

    get comment() {
        return this.record.comment;
    }

    get state() {
        return this.record.state;
    }

    get steps() {
        return this.record.steps.map(step => {
            return this.enrichStep({ createdBy: this.record.createdBy, step });
        });
    }

    get createdOn() {
        return this.record.createdOn;
    }

    get savedOn() {
        return this.record.savedOn;
    }

    get createdBy() {
        return this.record.createdBy;
    }

    get savedBy() {
        return this.record.savedBy;
    }

    get done(): boolean {
        /**
         * A just-in-case check.
         */
        if (this.record.steps.length === 0) {
            return false;
        }
        return this.record.steps.every(step => {
            return step.state === WorkflowStateRecordState.approved;
        });
    }

    /**
     * Current step can be:
     * - in review step
     * - rejected step - can only be one
     * - first pending step
     * - last approved step
     */
    get currentStep(): IEnrichedWorkflowStateRecordStep {
        const steps = this.steps;
        const inReview = steps.find(step => step.state === WorkflowStateRecordState.inReview);
        if (inReview) {
            return inReview;
        }

        const rejected = steps.find(step => step.state === WorkflowStateRecordState.rejected);
        if (rejected) {
            return rejected;
        }
        const pending = steps.find(step => step.state === WorkflowStateRecordState.pending);
        if (pending) {
            return pending;
        }
        const approved = steps
            .toReversed()
            .find(step => step.state === WorkflowStateRecordState.approved);
        if (approved) {
            return approved;
        }
        throw new WorkflowStateNoCurrentStepError(steps);
    }

    get nextStep(): IEnrichedWorkflowStateRecordStep | null {
        const steps = this.steps;
        const currentStep = this.currentStep;
        const currentIndex = steps.findIndex(step => step.id === currentStep.id);
        if (currentIndex === -1) {
            return null;
        }
        return steps[currentIndex + 1] || null;
    }

    get previousStep(): IEnrichedWorkflowStateRecordStep | null {
        const steps = this.steps;
        const currentStep = this.currentStep;
        const currentIndex = steps.findIndex(step => step.id === currentStep.id);
        if (currentIndex <= 0) {
            return null;
        }
        return steps[currentIndex - 1] || null;
    }

    /**
     * Active step is the one that is currently "inReview". If there is a rejected step, returns null.
     */
    getActiveStep(): IEnrichedWorkflowStateRecordStep | null {
        const steps = this.steps;
        const hasRejected = steps.some(step => {
            return step.state === WorkflowStateRecordState.rejected;
        });
        if (hasRejected) {
            return null;
        }
        const step = steps.find(step => {
            return step.state === WorkflowStateRecordState.inReview;
        });
        return step || null;
    }

    start(): Result<void, WorkflowState.Error> {
        const step = this.getPendingStep();
        if (!canReview(step)) {
            return Result.fail(new WorkflowStateStepCannotReviewError(step));
        }

        this.updateStep(step.id, {
            savedBy: this.currentIdentity,
            state: WorkflowStateRecordState.inReview
        });
        this.updateRecord({
            savedBy: this.currentIdentity,
            state: WorkflowStateRecordState.inReview
        });

        return Result.ok();
    }

    takeOver(): Result<void, WorkflowState.Error> {
        if (isRejected(this.record)) {
            return Result.fail(new WorkflowStateRejectedError(this.record));
        }
        const step = this.getActiveStep();
        if (!step) {
            return Result.fail(
                new WorkflowStateNotAuthorizedError(
                    `Cannot take over a workflow state that is not in review.`
                )
            );
        }
        if (!canTakeOver(step)) {
            return Result.fail(new WorkflowStateStepCannotTakeOverError(step));
        }
        if (!canReview(step)) {
            return Result.fail(new WorkflowStateStepCannotReviewError(step));
        }

        this.updateStep(step.id, {
            savedBy: this.currentIdentity
        });
        this.updateRecord({
            savedBy: this.currentIdentity
        });

        return Result.ok();
    }

    approve(comment?: string): Result<void, WorkflowState.Error> {
        if (isRejected(this.record)) {
            return Result.fail(new WorkflowStateRejectedError(this.record));
        }
        const step = this.getActiveStep();
        /**
         * Step cannot be found - all steps are either approved or rejected.
         */
        if (!step) {
            return Result.fail(
                new WorkflowStateNotAuthorizedError(
                    `Cannot approve a workflow state that is not in review.`
                )
            );
        }
        if (!canReview(step)) {
            return Result.fail(new WorkflowStateStepCannotReviewError(step));
        }
        if (!isStepOwner(step)) {
            return Result.fail(new WorkflowStateStepNotStepOwnerError(step));
        }

        this.approveStep(step.id, comment);

        const nextStep = this.getNextStep(step.id);

        this.updateRecord({
            state: nextStep ? WorkflowStateRecordState.pending : WorkflowStateRecordState.approved
        });

        return Result.ok();
    }

    reject(comment: string): Result<void, WorkflowState.Error> {
        if (isRejected(this.record)) {
            return Result.fail(new WorkflowStateRejectedError(this.record));
        }
        const step = this.getActiveStep();
        if (!step) {
            return Result.fail(
                new WorkflowStateNotAuthorizedError(
                    `Cannot reject a workflow state that is not in review.`
                )
            );
        }

        if (!canReview(step)) {
            return Result.fail(new WorkflowStateStepCannotReviewError(step));
        }
        if (!isStepOwner(step)) {
            return Result.fail(new WorkflowStateStepNotStepOwnerError(step));
        }

        this.rejectStep(step.id, comment);
        this.updateRecord({
            state: WorkflowStateRecordState.rejected
        });

        return Result.ok();
    }

    private getPendingStep() {
        if (isRejected(this.record)) {
            throw new WorkflowStateRejectedError(this.record);
        }
        if (isInReview(this.record)) {
            throw new WorkflowStateInReviewError(this.record);
        }
        for (const step of this.steps) {
            if (step.state === WorkflowStateRecordState.pending) {
                return step;
            }
        }
        throw new WorkflowStateNoPendingStepError();
    }

    private updateRecord(record: Partial<Omit<IWorkflowStateRecord, "id">>): void {
        Object.assign(this.record, record);
    }

    private updateStep(id: string, input: Partial<Omit<IWorkflowStateRecordStep, "id">>): void {
        const step = this.record.steps.find(s => s.id === id);
        if (!step) {
            throw new Error(`Step with ID "${id}" not found.`);
        }
        Object.assign(step, {
            savedBy: this.currentIdentity,
            ...input
        });
    }

    private approveStep(id: string, comment?: string): void {
        this.updateStep(id, {
            state: WorkflowStateRecordState.approved,
            comment
        });
    }

    private rejectStep(id: string, comment: string): void {
        this.updateStep(id, {
            state: WorkflowStateRecordState.rejected,
            comment
        });
    }

    private getNextStep(currentStepId: string): IWorkflowStateRecordStep | undefined {
        const index = this.record.steps.findIndex(s => s.id === currentStepId);
        if (index === -1) {
            return undefined;
        }
        return this.record.steps[index + 1];
    }

    private enrichStep(params: IEnrichStepWithPermissionParams): IEnrichedWorkflowStateRecordStep {
        const { step, createdBy } = params;
        const identity = this.currentIdentity;
        /**
         * User which created the workflow state cannot take part in reviewing it.
         */
        if (createdBy.id === identity.id) {
            return {
                ...step,
                isOwner: false,
                canTakeOver: false,
                canReview: false
            };
        }
        /**
         * Current user is step owner - they started the review.
         */
        const isOwner = step.savedBy?.id === identity.id;
        /**
         * Can current user actually review this step?
         */
        const canReview = step.teams.some(team => {
            return this.teams.some(t => {
                return t.id === team.id;
            });
        });
        /**
         * Can current user take over the review from another reviewer?
         * Taking over is only possible if current user did not start the review of the step - and review was actually started.
         */
        const canTakeOver =
            canReview && !!step.savedBy?.id && step.state === WorkflowStateRecordState.inReview;

        return {
            ...step,
            canTakeOver: !isOwner ? canTakeOver : false,
            isOwner,
            canReview
        };
    }
}

export namespace WorkflowState {
    export type Error =
        | WorkflowStateNotAuthorizedError
        | WorkflowStateNoPendingStepError
        | WorkflowStateStepCannotReviewError
        | WorkflowStateStepCannotTakeOverError
        | WorkflowStateStepNotStepOwnerError
        | WorkflowStateInReviewError
        | WorkflowStateRejectedError
        | WorkflowStateNoCurrentStepError;
}
