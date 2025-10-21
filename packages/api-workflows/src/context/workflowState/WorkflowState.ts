import { Context } from "~/types.js";
import type { IWorkflow } from "../abstractions/Workflow.js";
import type {
    IWorkflowState,
    IWorkflowStateIdentity,
    IWorkflowStateRecord,
    IWorkflowStateRecordStep,
    IWorkflowStateStep
} from "../abstractions/WorkflowState.js";
import { WorkflowStateRecordState } from "../abstractions/WorkflowState.js";
import { WebinyError } from "@webiny/error";

export interface IWorkflowStateParams {
    workflow: IWorkflow | undefined | null;
    record: IWorkflowStateRecord;
    context: Pick<Context, "workflowState" | "security" | "adminUsers">;
}

export class WorkflowState implements IWorkflowState {
    public readonly context;
    public readonly workflow;
    public readonly record;

    public get done(): boolean {
        return this.record.steps.every(step => {
            return step.state === WorkflowStateRecordState.approved;
        });
    }
    public get activeStep(): IWorkflowStateStep | undefined {
        const step = this.record.steps.find(step => {
            return step.state !== WorkflowStateRecordState.approved;
        });
        if (!step) {
            return undefined;
        }

        const workflowStep = this.workflow?.steps.find(s => s.id === step.id);

        return {
            ...step,
            name: workflowStep?.title || "unknown"
        };
    }

    public constructor(params: IWorkflowStateParams) {
        this.context = params.context;
        this.workflow = params.workflow;
        this.record = params.record;
    }

    public async start(): Promise<void> {
        await this.ensureCanReview();

        if (this.record.state === WorkflowStateRecordState.rejected) {
            throw new WebinyError({
                message: `Cannot start a workflow that has been rejected.`,
                code: "WORKFLOW_ALREADY_REJECTED",
                data: {
                    ...this.record
                }
            });
        }

        const stepIndex = this.record.steps.findIndex(step => {
            return step.state === WorkflowStateRecordState.pending;
        });

        if (stepIndex === -1) {
            throw new WebinyError({
                message: `Cannot review a workflow that has no pending steps.`,
                code: "WORKFLOW_NO_PENDING_STEPS",
                data: {
                    ...this.record
                }
            });
        }
        /**
         * Note that previous step, if exists, must be approved.
         */
        const previousStep = this.record.steps[stepIndex - 1];
        if (previousStep && previousStep.state !== WorkflowStateRecordState.approved) {
            throw new WebinyError({
                message: `Cannot start workflow step review because the previous step is not approved yet.`,
                code: "WORKFLOW_PREVIOUS_STEP_NOT_APPROVED",
                data: {
                    ...this.record,
                    previousStep
                }
            });
        }
        const step = this.record.steps[stepIndex];

        this.updateStep(step.id, {
            state: WorkflowStateRecordState.inReview
        });
        this.updateRecord({
            state: WorkflowStateRecordState.inReview
        });
        await this.updateState(this.record);
    }

    public async approve(comment?: string): Promise<void> {
        await this.ensureCanReview();

        const step = this.record.steps.find(step => {
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
                    ...this.record
                }
            );
        }

        this.approveStep(step.id, comment);

        const nextStep = this.getNextStep(step.id);

        this.updateRecord({
            state: nextStep ? WorkflowStateRecordState.pending : WorkflowStateRecordState.approved
        });

        await this.updateState(this.record);
    }

    public async reject(comment: string): Promise<void> {
        await this.ensureCanReview();
        const step = this.record.steps.find(step => {
            return step.state === WorkflowStateRecordState.inReview;
        });
        if (!step) {
            throw new WebinyError(
                `Cannot reject a workflow state that is not in review.`,
                "WORKFLOW_NOT_IN_REVIEW",
                {
                    ...this.record
                }
            );
        }
        this.rejectStep(step.id, comment);
        this.updateRecord({
            state: WorkflowStateRecordState.rejected
        });
        await this.updateState(this.record);
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
        const index = this.record.steps.findIndex(s => s.id === id);
        if (index === -1) {
            return undefined;
        }
        return this.record.steps[index + 1];
    }

    private async updateState(input: IWorkflowStateRecord): Promise<void> {
        const record = structuredClone(input);
        // @ts-expect-error
        delete record["id"];
        await this.context.workflowState.updateState(this.record.id, record);
    }

    private async ensureCanReview(): Promise<void> {
        if (!this.workflow) {
            throw new WebinyError({
                message: `Cannot review a workflow state without a linked workflow.`,
                code: "WORKFLOW_NOT_FOUND",
                data: {
                    ...this.record
                }
            });
        }
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
                    workflow: this.workflow,
                    record: this.record
                }
            });
        }
        const workflowStep = this.workflow.steps.find(s => s.id === step.id);
        if (!workflowStep) {
            throw new WebinyError({
                message: `Workflow step with ID "${step.id}" not found.`,
                code: "WORKFLOW_STEP_NOT_FOUND",
                data: {
                    step,
                    workflow: this.workflow,
                    record: this.record
                }
            });
        }
        const canReview = workflowStep.teams.some(team => {
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
}
