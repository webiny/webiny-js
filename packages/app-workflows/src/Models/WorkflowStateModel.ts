import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import { WorkflowStateStepModel } from "./WorkflowStateStepModel.js";
import type { IWorkflowStateModel } from "./abstractions/WorkflowStateModel.js";
import type { IWorkflowStateStepModel } from "./abstractions/WorkflowStateStepModel.js";
import { type IWorkflowState, type IWorkflowStateStep, WorkflowStateValue } from "~/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";

const createSnapshot = (data: IWorkflowState) => {
    data.app;
    return JSON.stringify({
        id: data.id,
        app: data.app,
        targetId: data.targetId,
        targetRevisionId: data.targetRevisionId,
        comment: data.comment,
        state: data.state,
        steps: data.steps.map(step => ({
            id: step.id,
            comment: step.comment,
            savedBy: step.savedBy,
            state: step.state
        }))
    });
};

export class WorkflowStateModel implements IWorkflowStateModel {
    private snapshot: string;
    public id;
    public app;
    public targetId;
    public targetRevisionId;
    public comment;
    public state;
    public steps;
    public workflow;
    public createdBy;
    public savedBy;
    public createdOn;
    public savedOn;

    public get dirty(): boolean {
        return this.snapshot !== createSnapshot(this.toJS());
    }

    public get currentStep(): IWorkflowStateStepModel | null {
        const inReview = this.steps.find(step => step.state === WorkflowStateValue.inReview);
        if (inReview) {
            return inReview;
        }
        const pending = this.steps.find(step => step.state === WorkflowStateValue.pending);
        return pending || null;
    }

    public get nextStep(): IWorkflowStateStepModel | null {
        const index = this.steps.findIndex(step => step.state === WorkflowStateValue.inReview);
        if (index === -1) {
            return null;
        }
        return this.steps[index + 1] || null;
    }

    public constructor(data: IWorkflowState) {
        this.snapshot = createSnapshot(data);
        this.id = data.id;
        this.app = data.app;
        this.targetId = data.targetId;
        this.targetRevisionId = data.targetRevisionId;
        this.comment = data.comment;
        this.state = data.state;
        this.workflow = data.workflow;
        this.createdBy = data.createdBy;
        this.savedBy = data.savedBy;
        this.createdOn = data.createdOn;
        this.savedOn = data.savedOn;
        this.steps = observable.array<IWorkflowStateStepModel>();

        const steps = data.steps.map(step => {
            const workflowStep = this.findWorkflowStep(step.id);
            return new WorkflowStateStepModel(step, workflowStep);
        });

        this.steps.replace(steps);

        makeAutoObservable(this);
    }

    public toJS(): IWorkflowState {
        return toJS({
            id: this.id,
            app: this.app,
            targetId: this.targetId,
            targetRevisionId: this.targetRevisionId,
            comment: this.comment,
            state: this.state,
            workflow: this.workflow,
            createdBy: this.createdBy,
            savedBy: this.savedBy,
            createdOn: this.createdOn,
            savedOn: this.savedOn,
            steps: this.steps.map(step => {
                return step.toJS();
            }) as unknown as NonEmptyArray<IWorkflowStateStep>
        });
    }

    public setSteps(steps: IWorkflowStateStep[]) {
        runInAction(() => {
            this.steps.replace(
                steps.map(step => {
                    const workflowStep = this.findWorkflowStep(step.id);
                    return new WorkflowStateStepModel(step, workflowStep);
                })
            );
        });
    }

    public addStep(step: IWorkflowStateStep) {
        runInAction(() => {
            const workflowStep = this.findWorkflowStep(step.id);
            this.steps.push(new WorkflowStateStepModel(step, workflowStep));
        });
    }

    public updateStep(step: IWorkflowStateStep) {
        const existingStep = this.findStep(step.id);
        if (!existingStep) {
            return;
        }
        existingStep.updateStep(step);
    }

    public removeStep(id: string) {
        const index = this.steps.findIndex(s => s.id === id);
        if (index === -1) {
            return;
        }
        runInAction(() => {
            this.steps.splice(index, 1);
        });
    }

    public findStep(id: string) {
        return this.steps.find(s => s.id === id);
    }

    private findWorkflowStep(id: string) {
        const step = this.workflow.steps.find(s => s.id === id);
        if (step) {
            return step;
        }
        throw new Error(
            `Workflow step with id "${id}" was not found in workflow "${this.workflow.id}"!`
        );
    }
}
