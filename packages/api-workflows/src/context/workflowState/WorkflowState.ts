import { Context } from "~/types.js";
import type {
    IWorkflowStateIdentity,
    IWorkflowStateModel,
    IWorkflowStateRecord,
    IWorkflowStateRecordStep,
    IWorkflowStateRecordStepWithPermissions
} from "../abstractions/WorkflowState.js";
import { WorkflowStateRecordState } from "../abstractions/WorkflowState.js";
import { WebinyError } from "@webiny/error";
import type { IWorkflowStepTeam } from "~/context/abstractions/Workflow.js";

export interface IWorkflowStateParams {
    record: IWorkflowStateRecord;
    teams: IWorkflowStepTeam[];
    context: Pick<Context, "workflowState" | "security" | "adminUsers">;
}

export class WorkflowState implements IWorkflowStateModel {
    public readonly context;
    readonly #record;
    private readonly teams;

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
            return this.enrichStepWithPermissions(step);
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

    public get currentStep(): IWorkflowStateRecordStepWithPermissions {
        const step = this.getActiveStep();
        if (step) {
            return step;
        }
        const steps = this.steps.toReversed();
        const rejected = steps.find(step => step.state === WorkflowStateRecordState.rejected);
        if (rejected) {
            return rejected;
        }
        const approved = steps.find(step => step.state === WorkflowStateRecordState.approved);
        if (approved) {
            return approved;
        }
        const inReview = steps.find(step => step.state === WorkflowStateRecordState.inReview);
        if (inReview) {
            return inReview;
        }
        const pending = steps.find(step => step.state === WorkflowStateRecordState.pending);
        if (pending) {
            return pending;
        }
        return steps[0];
    }

    public get nextStep(): IWorkflowStateRecordStepWithPermissions | null {
        const steps = this.steps;
        const currentStep = this.currentStep;
        const currentIndex = steps.findIndex(step => step.id === currentStep.id);
        if (currentIndex === -1) {
            return null;
        }
        return steps[currentIndex + 1] || null;
    }

    public get previousStep(): IWorkflowStateRecordStepWithPermissions | null {
        const steps = this.steps;
        const currentStep = this.currentStep;
        const currentIndex = steps.findIndex(step => step.id === currentStep.id);
        if (currentIndex <= 0) {
            return null;
        }
        return steps[currentIndex - 1] || null;
    }

    public constructor(params: IWorkflowStateParams) {
        this.context = params.context;
        this.#record = params.record;
        this.teams = params.teams;
    }

    public getActiveStep(): IWorkflowStateRecordStepWithPermissions | undefined {
        const steps = this.steps;
        const hasRejected = steps.some(step => {
            return step.state === WorkflowStateRecordState.rejected;
        });
        if (hasRejected) {
            return undefined;
        }
        for (const step of steps) {
            if (step.state === WorkflowStateRecordState.inReview) {
                return step;
            }
        }
        return undefined;
    }

    public async approve(comment?: string): Promise<void> {
        this.ensureNotRejected();
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
        await this.ensureCanReview(step);

        this.approveStep(step.id, comment);

        const nextStep = this.getNextStep(step.id);
        if (nextStep) {
            this.updateStep(nextStep.id, {
                state: WorkflowStateRecordState.inReview,
                savedBy: null
            });
        }

        this.updateRecord({
            state: nextStep ? WorkflowStateRecordState.inReview : WorkflowStateRecordState.approved
        });

        await this.updateState(this.#record);
    }

    public async reject(comment: string): Promise<void> {
        this.ensureNotRejected();
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

        await this.ensureCanReview(step);

        this.rejectStep(step.id, comment);
        this.updateRecord({
            state: WorkflowStateRecordState.rejected
        });
        await this.updateState(this.#record);
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
        await this.context.workflowState.updateState(this.#record.id, record);
    }

    private async ensureCanReview(step: IWorkflowStateRecordStep): Promise<void> {
        const identity = this.context.security.getIdentity();
        if (!identity?.id) {
            throw new WebinyError({
                message: `You must be logged in to be able to review a workflow state step.`,
                code: "NOT_AUTHENTICATED"
            });
        }

        if (this.teams.length === 0) {
            throw new WebinyError({
                message: `You are not assigned to any team and therefore cannot review this workflow state step.`,
                code: "WORKFLOW_REVIEWER_NO_TEAMS",
                data: {
                    step,
                    record: this.#record
                }
            });
        }
        const canReview = step.teams.some(team => {
            return this.teams.some(t => {
                return team.id === t.id;
            });
        });
        if (canReview) {
            return;
        }
        throw new WebinyError({
            message: `You are not assigned to a team that can review this workflow state step.`,
            code: "WORKFLOW_REVIEWER_CANNOT_REVIEW",
            data: {
                step
            }
        });
    }

    private getIdentity(): IWorkflowStateIdentity {
        const identity = this.context.security.getIdentity();
        return {
            id: identity.id,
            displayName: identity.displayName || null,
            type: identity.type || null
        };
    }

    private enrichStepWithPermissions(
        step: IWorkflowStateRecordStep
    ): IWorkflowStateRecordStepWithPermissions {
        const isAllowedToReview = step.teams.some(team => {
            return this.teams.some(t => {
                return t.id === team.id;
            });
        });
        return {
            ...step,
            isAllowedToReview
        };
    }

    private ensureNotRejected(): void {
        if (this.#record.state !== WorkflowStateRecordState.rejected) {
            return;
        }
        throw new WebinyError(
            `Cannot perform this action on a workflow state that has been rejected.`,
            "WORKFLOW_STATE_REJECTED",
            {
                ...this.#record
            }
        );
    }
}
