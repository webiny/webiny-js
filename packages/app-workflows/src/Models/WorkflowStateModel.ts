import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import { WorkflowStateStepModel } from "./WorkflowStateStepModel.js";
import type { IWorkflowStateModel } from "./abstractions/WorkflowStateModel.js";
import type { IWorkflowStateStepModel } from "./abstractions/WorkflowStateStepModel.js";
import type { IWorkflowState, IWorkflowStateStep } from "~/types.js";
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
            userId: step.userId,
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

    public get dirty(): boolean {
        return this.snapshot !== createSnapshot(this.toJS());
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
        this.steps = observable.array<IWorkflowStateStepModel>();

        this.steps.replace(
            data.steps.map(step => {
                return new WorkflowStateStepModel(step);
            })
        );

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
            steps: this.steps.map(step => {
                return step.toJS();
            }) as unknown as NonEmptyArray<IWorkflowStateStep>
        });
    }

    public setSteps(steps: IWorkflowStateStep[]) {
        runInAction(() => {
            this.steps.replace(
                steps.map(step => {
                    return new WorkflowStateStepModel(step);
                })
            );
        });
    }

    public addStep(step: IWorkflowStateStep) {
        runInAction(() => {
            this.steps.push(new WorkflowStateStepModel(step));
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
}
