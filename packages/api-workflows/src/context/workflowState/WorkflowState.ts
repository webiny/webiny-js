import { Context } from "~/types.js";
import type {
    IWorkflowState,
    IWorkflowStateIdentity,
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

export class WorkflowState implements IWorkflowState {
    public readonly context;
    readonly #record;
    private readonly teams;

    public get id() {
        return this.#record.id;
    }

    public get app() {
        return this.#record.app;
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

    public get activeStep(): IWorkflowStateRecordStepWithPermissions | undefined {
        const hasRejected = this.#record.steps.some(step => {
            return step.state === WorkflowStateRecordState.rejected;
        });
        if (hasRejected) {
            return undefined;
        }
        for (const step of this.#record.steps) {
            if (
                step.state === WorkflowStateRecordState.pending ||
                step.state === WorkflowStateRecordState.inReview
            ) {
                return this.enrichStepWithPermissions(step);
            }
        }
        return undefined;
    }

    public constructor(params: IWorkflowStateParams) {
        this.context = params.context;
        this.#record = params.record;
        this.teams = params.teams;
    }

    public async start(): Promise<void> {
        await this.ensureCanReview();

        if (this.#record.state === WorkflowStateRecordState.rejected) {
            throw new WebinyError({
                message: `Cannot start a workflow that has been rejected.`,
                code: "WORKFLOW_ALREADY_REJECTED",
                data: {
                    ...this.#record
                }
            });
        }

        const stepIndex = this.#record.steps.findIndex(step => {
            return step.state === WorkflowStateRecordState.pending;
        });

        if (stepIndex === -1) {
            throw new WebinyError({
                message: `Cannot review a workflow that has no pending steps.`,
                code: "WORKFLOW_NO_PENDING_STEPS",
                data: {
                    ...this.#record
                }
            });
        }
        /**
         * Note that previous step, if exists, must be approved.
         */
        const previousStep = this.#record.steps[stepIndex - 1];
        if (previousStep && previousStep.state !== WorkflowStateRecordState.approved) {
            throw new WebinyError({
                message: `Cannot start workflow step review because the previous step is not approved yet.`,
                code: "WORKFLOW_PREVIOUS_STEP_NOT_APPROVED",
                data: {
                    ...this.#record,
                    previousStep
                }
            });
        }
        const step = this.#record.steps[stepIndex];

        this.updateStep(step.id, {
            state: WorkflowStateRecordState.inReview
        });
        this.updateRecord({
            state: WorkflowStateRecordState.inReview
        });
        await this.updateState(this.#record);
    }

    public async approve(comment?: string): Promise<void> {
        await this.ensureCanReview();

        const step = this.#record.steps.find(step => {
            return step.state === WorkflowStateRecordState.inReview;
        });
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

        this.approveStep(step.id, comment);

        const nextStep = this.getNextStep(step.id);

        this.updateRecord({
            state: nextStep ? WorkflowStateRecordState.pending : WorkflowStateRecordState.approved
        });

        await this.updateState(this.#record);
    }

    public async reject(comment: string): Promise<void> {
        await this.ensureCanReview();
        const step = this.#record.steps.find(step => {
            return step.state === WorkflowStateRecordState.inReview;
        });
        if (!step) {
            throw new WebinyError(
                `Cannot reject a workflow state that is not in review.`,
                "WORKFLOW_NOT_IN_REVIEW",
                {
                    ...this.#record
                }
            );
        }
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

    private getNextStep(id: string): IWorkflowStateRecordStep | undefined {
        const index = this.#record.steps.findIndex(s => s.id === id);
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

    private async ensureCanReview(): Promise<void> {
        const identity = this.context.security.getIdentity();
        if (!identity?.id) {
            throw new WebinyError({
                message: `You must be logged in to be able to review a workflow.`,
                code: "NOT_AUTHENTICATED"
            });
        }
        const step = this.activeStep;
        if (!step) {
            return;
        }
        const teams = await this.context.adminUsers.listUserTeams(identity.id);
        if (!teams?.length) {
            throw new WebinyError({
                message: `You are not assigned to any team and therefore cannot review this workflow.`,
                code: "WORKFLOW_REVIEWER_NO_TEAMS",
                data: {
                    step,
                    record: this.#record
                }
            });
        }
        const canReview = step.teams.some(team => {
            return teams.some(t => {
                return team.id === t.id;
            });
        });
        if (canReview) {
            return;
        }
        throw new WebinyError({
            message: `You are not assigned to a team that can review this workflow.`,
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
}
