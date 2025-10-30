import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import { WorkflowStateStepModel } from "./WorkflowStateStepModel.js";
import type { IWorkflowStateModel } from "./abstractions/WorkflowStateModel.js";
import type { IWorkflowStateStepModel } from "./abstractions/WorkflowStateStepModel.js";
import { type IWorkflowState, type IWorkflowStateStep, WorkflowStateValue } from "~/types.js";

const createSnapshot = (input: IWorkflowState) => {
    return JSON.stringify(toJS(input));
};

export class WorkflowStateModel implements IWorkflowStateModel {
    #snapshot: string;
    public id;
    public isActive;
    public app;
    public title;
    public targetId;
    public targetRevisionId;
    public comment;
    public state;
    public steps;
    public createdBy;
    public savedBy;
    public createdOn;
    public savedOn;

    public get dirty(): boolean {
        return this.#snapshot !== createSnapshot(this.toJS());
    }

    public get currentStep(): IWorkflowStateStepModel | null {
        return this.steps.find(step => step.state === WorkflowStateValue.inReview) || null;
    }

    public get nextStep(): IWorkflowStateStepModel | null {
        const current = this.currentStep;
        if (!current) {
            return null;
        }
        const index = this.steps.findIndex(step => step.id === current.id);
        if (index === -1) {
            return null;
        }
        return this.steps[index + 1] || null;
    }

    public get lastApproved(): IWorkflowStateStepModel | null {
        const steps = this.steps.toReversed();
        for (const step of steps) {
            if (step.state === WorkflowStateValue.approved) {
                return step;
            }
        }
        return null;
    }

    public get lastRejected(): IWorkflowStateStepModel | null {
        const steps = this.steps.toReversed();
        for (const step of steps) {
            if (step.state === WorkflowStateValue.rejected) {
                return step;
            }
        }
        return null;
    }

    public constructor(params: IWorkflowState) {
        this.#snapshot = createSnapshot(params);
        this.id = params.id;
        this.app = params.app;
        this.title = params.title;
        this.targetId = params.targetId;
        this.targetRevisionId = params.targetRevisionId;
        this.comment = params.comment;
        this.state = params.state;
        this.createdBy = params.createdBy;
        this.savedBy = params.savedBy;
        this.createdOn = params.createdOn;
        this.savedOn = params.savedOn;
        this.isActive = params.isActive;
        this.steps = observable.array<IWorkflowStateStepModel>();

        const steps = params.steps.map(step => {
            return new WorkflowStateStepModel(step);
        });

        this.steps.replace(steps);

        makeAutoObservable(this);
    }

    public toJS(): IWorkflowState {
        return toJS({
            id: this.id,
            isActive: this.isActive,
            app: this.app,
            title: this.title,
            targetId: this.targetId,
            targetRevisionId: this.targetRevisionId,
            comment: this.comment,
            state: this.state,
            createdBy: this.createdBy,
            savedBy: this.savedBy,
            createdOn: this.createdOn,
            savedOn: this.savedOn,
            steps: this.steps.map(step => {
                return step.toJS();
            })
        });
    }

    public setSteps(steps: IWorkflowStateStep[]) {
        runInAction(() => {
            this.steps.replace(
                steps.map(step => {
                    return new WorkflowStateStepModel(step);
                })
            );
            this.updateSnapshot();
        });
    }

    public addStep(step: IWorkflowStateStep) {
        runInAction(() => {
            this.steps.push(new WorkflowStateStepModel(step));
            this.updateSnapshot();
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
            this.updateSnapshot();
        });
    }

    public findStep(id: string) {
        return this.steps.find(s => s.id === id);
    }

    private updateSnapshot() {
        this.#snapshot = createSnapshot(this.toJS());
    }
}
