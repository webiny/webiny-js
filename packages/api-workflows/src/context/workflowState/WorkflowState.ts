import { Context } from "~/types.js";
import type { IWorkflow } from "../abstractions/Workflow.js";
import type {
    IWorkflowState,
    IWorkflowStateRecord,
    IWorkflowStateRecordStep,
    IWorkflowStateStep
} from "../abstractions/WorkflowState.js";
import { WorkflowStateRecordState } from "../abstractions/WorkflowState.js";
import { WebinyError } from "@webiny/error";

export interface IWorkflowStateParams {
    workflow: IWorkflow | undefined | null;
    record: IWorkflowStateRecord;
    context: Pick<Context, "workflowState" | "security">;
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

    public async review(): Promise<void> {
        const step = this.record.steps.find(step => {
            return step.state === WorkflowStateRecordState.pending;
        });
        if (!step) {
            throw new WebinyError({
                message: `Cannot review a workflow that has no pending steps.`,
                code: "WORKFLOW_NO_PENDING_STEPS",
                data: {
                    ...this.record
                }
            });
        }
        this.updateStep(step.id, {
            state: WorkflowStateRecordState.inReview
        });
        this.updateRecord({
            state: WorkflowStateRecordState.inReview
        });
        await this.updateState(this.record);
    }

    public async approve(comment?: string): Promise<void> {
        const step = this.record.steps.find(step => {
            return step.state === WorkflowStateRecordState.inReview;
        });
        /**
         * Step cannot be found - all steps are either approved or rejected.
         */
        if (!step) {
            const rejected = this.record.steps.some(step => {
                return step.state === WorkflowStateRecordState.rejected;
            });
            const state = rejected
                ? WorkflowStateRecordState.rejected
                : WorkflowStateRecordState.approved;
            this.updateRecord({
                state
            });
            await this.updateState(this.record);
            return;
        }

        this.approveStep(step.id, comment);

        const nextStep = this.getNextStep(step.id);

        if (nextStep) {
            this.updateStep(nextStep.id, {
                state: WorkflowStateRecordState.inReview
            });
        }

        this.updateRecord({
            state: nextStep ? WorkflowStateRecordState.inReview : WorkflowStateRecordState.approved
        });

        await this.updateState(this.record);
    }

    public async reject(comment: string): Promise<void> {
        const step = this.record.steps.find(step => {
            return step.state === WorkflowStateRecordState.inReview;
        });
        if (!step) {
            throw new Error(`Cannot reject a workflow that is not in review.`);
        }
        this.rejectStep(step.id, comment);
        this.updateRecord({
            state: WorkflowStateRecordState.rejected
        });
        await this.updateState(this.record);
    }

    public async cancel(): Promise<void> {
        throw new Error("Method not implemented.");
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
            userId: this.context.security.getIdentity().id,
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
}
