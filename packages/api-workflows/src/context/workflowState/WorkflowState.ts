import { Context } from "~/types.js";
import type {
    IEnrichedWorkflowStateRecordStep,
    IWorkflowStateIdentity,
    IWorkflowStateModel,
    IWorkflowStateRecord,
    IWorkflowStateRecordStep
} from "../abstractions/WorkflowState.js";
import { WorkflowStateRecordState } from "../abstractions/WorkflowState.js";
import { WebinyError } from "@webiny/error";
import type { IWorkflowStepTeam } from "~/context/abstractions/Workflow.js";
import { WorkflowStateNoPendingStepError } from "../errors/index.js";
import {
    ensureCanReview,
    ensureCanTakeOver,
    ensureIsStepOwner,
    ensureNotInReview,
    ensureNotRejected
} from "./guards/index.js";

export interface IWorkflowStateParams {
    record: IWorkflowStateRecord;
    teams: IWorkflowStepTeam[];
    context: Pick<Context, "workflowState" | "security" | "adminUsers">;
}

interface IEnrichStepWithPermissionParams {
    createdBy: Pick<IWorkflowStateIdentity, "id">;
    step: IWorkflowStateRecordStep;
}

export class WorkflowState implements IWorkflowStateModel {
    readonly #context;
    readonly #record;
    readonly #teams;

    public get id() {
        return this.#record.id;
    }

    public get app() {
        return this.#record.app;
    }

    public get title() {
        return this.#record.title;
    }

    public get workflowId() {
        return this.#record.workflowId;
    }

    public get targetId() {
        return this.#record.targetId;
    }

    public get targetRevisionId() {
        return this.#record.targetRevisionId;
    }

    public get isActive() {
        return this.#record.isActive;
    }

    public get comment() {
        return this.#record.comment;
    }

    public get state() {
        return this.#record.state;
    }

    public get steps() {
        return this.#record.steps.map(step => {
            return this.enrichStep({
                createdBy: this.#record.createdBy,
                step
            });
        });
    }

    public get createdOn() {
        return this.#record.createdOn;
    }

    public get savedOn() {
        return this.#record.savedOn;
    }

    public get createdBy() {
        return this.#record.createdBy;
    }

    public get savedBy() {
        return this.#record.savedBy;
    }

    public get done(): boolean {
        return this.#record.steps.every(step => {
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
    public get currentStep(): IEnrichedWorkflowStateRecordStep {
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
        throw new WebinyError({
            message: `Cannot determine the current step of the workflow state.`,
            code: "WORKFLOW_STATE_NO_CURRENT_STEP",
            data: {
                steps
            }
        });
    }

    public get nextStep(): IEnrichedWorkflowStateRecordStep | null {
        const steps = this.steps;
        const currentStep = this.currentStep;
        const currentIndex = steps.findIndex(step => step.id === currentStep.id);
        if (currentIndex === -1) {
            return null;
        }
        return steps[currentIndex + 1] || null;
    }

    public get previousStep(): IEnrichedWorkflowStateRecordStep | null {
        const steps = this.steps;
        const currentStep = this.currentStep;
        const currentIndex = steps.findIndex(step => step.id === currentStep.id);
        if (currentIndex <= 0) {
            return null;
        }
        return steps[currentIndex - 1] || null;
    }

    public constructor(params: IWorkflowStateParams) {
        this.#context = params.context;
        this.#record = params.record;
        this.#teams = params.teams;
    }
    /**
     * Active step is the one that is currently "inReview". If there is a rejected step, returns null.
     */
    public getActiveStep(): IEnrichedWorkflowStateRecordStep | null {
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

    public async start(): Promise<void> {
        const step = this.getPendingStep();
        ensureCanReview(step);

        this.updateStep(step.id, {
            savedBy: this.getIdentity(),
            state: WorkflowStateRecordState.inReview
        });
        this.updateRecord({
            savedBy: this.getIdentity(),
            state: WorkflowStateRecordState.inReview
        });
        return await this.updateState(this.#record);
    }

    public async takeOver(): Promise<void> {
        ensureNotRejected(this.#record);
        const step = this.getActiveStep();
        if (!step) {
            throw new WebinyError(
                `Cannot take over a workflow state that is not in review.`,
                "WORKFLOW_NOT_IN_REVIEW",
                {
                    ...this.#record
                }
            );
        }
        ensureCanTakeOver(step);
        ensureCanReview(step);

        this.updateStep(step.id, {
            savedBy: this.getIdentity()
        });
        this.updateRecord({
            savedBy: this.getIdentity()
        });
        return await this.updateState(this.#record);
    }

    public async approve(comment?: string): Promise<void> {
        ensureNotRejected(this.#record);
        const step = this.getActiveStep();
        /**
         * Step cannot be found - all steps are either approved or rejected.
         */
        if (!step) {
            throw new WebinyError(
                `Cannot approve a workflow state that is not in review.`,
                "WORKFLOW_NOT_IN_REVIEW",
                {
                    ...this.#record
                }
            );
        }
        ensureCanReview(step);
        ensureIsStepOwner(step);

        this.approveStep(step.id, comment);

        const nextStep = this.getNextStep(step.id);

        this.updateRecord({
            state: nextStep ? WorkflowStateRecordState.pending : WorkflowStateRecordState.approved
        });

        return await this.updateState(this.#record);
    }

    public async reject(comment: string): Promise<void> {
        ensureNotRejected(this.#record);
        const step = this.getActiveStep();
        if (!step) {
            throw new WebinyError(
                `Cannot reject a workflow state that is not in review.`,
                "WORKFLOW_NOT_IN_REVIEW",
                {
                    ...this.#record
                }
            );
        }

        ensureCanReview(step);
        ensureIsStepOwner(step);

        this.rejectStep(step.id, comment);
        this.updateRecord({
            state: WorkflowStateRecordState.rejected
        });
        return await this.updateState(this.#record);
    }

    private getPendingStep() {
        ensureNotRejected(this.#record);
        ensureNotInReview(this.#record);
        for (const step of this.steps) {
            if (step.state === WorkflowStateRecordState.pending) {
                return step;
            }
        }
        throw new WorkflowStateNoPendingStepError(this.#record);
    }

    private updateRecord(record: Partial<Omit<IWorkflowStateRecord, "id">>): void {
        Object.assign(this.#record, record);
    }

    private updateStep(id: string, input: Partial<Omit<IWorkflowStateRecordStep, "id">>): void {
        const step = this.#record.steps.find(s => s.id === id);
        if (!step) {
            throw new Error(`Step with ID "${id}" not found.`);
        }
        Object.assign(step, {
            savedBy: this.getIdentity(),
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
        const index = this.#record.steps.findIndex(s => s.id === currentStepId);
        if (index === -1) {
            return undefined;
        }
        return this.#record.steps[index + 1];
    }

    private async updateState(input: IWorkflowStateRecord): Promise<void> {
        const record = structuredClone(input);
        // @ts-expect-error
        delete record["id"];
        await this.#context.workflowState.updateState(this.#record.id, record);
    }

    private getIdentity(): IWorkflowStateIdentity {
        const identity = this.#context.security.getIdentity();
        return {
            id: identity.id,
            displayName: identity.displayName || null,
            type: identity.type || null
        };
    }

    private enrichStep(params: IEnrichStepWithPermissionParams): IEnrichedWorkflowStateRecordStep {
        const { step, createdBy } = params;
        const identity = this.getIdentity();
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
            return this.#teams.some(t => {
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
