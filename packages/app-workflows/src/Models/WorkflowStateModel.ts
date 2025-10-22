import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import { WorkflowStateStepModel } from "./WorkflowStateStepModel.js";
import type { IWorkflowStateModel } from "./abstractions/WorkflowStateModel.js";
import type { IWorkflowStateStepModel } from "./abstractions/WorkflowStateStepModel.js";
import { type IWorkflowState, type IWorkflowStateStep, WorkflowStateValue } from "~/types.js";

const createSnapshot = (input: IWorkflowState) => {
    return JSON.stringify(toJS(input));
    // return JSON.stringify({
    //     id: input.id,
    //     app: input.app,
    //     targetId: input.targetId,
    //     targetRevisionId: input.targetRevisionId,
    //     comment: input.comment,
    //     state: input.state,
    //     steps: input.steps.map(step => ({
    //         id: step.id,
    //         comment: step.comment,
    //         savedBy: step.savedBy,
    //         state: step.state
    //     }))
    // });
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

    public constructor(params: IWorkflowState) {
        this.snapshot = createSnapshot(params);
        this.id = params.id;
        this.app = params.app;
        this.targetId = params.targetId;
        this.targetRevisionId = params.targetRevisionId;
        this.comment = params.comment;
        this.state = params.state;
        this.createdBy = params.createdBy;
        this.savedBy = params.savedBy;
        this.createdOn = params.createdOn;
        this.savedOn = params.savedOn;
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
            app: this.app,
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
        this.snapshot = createSnapshot(this.toJS());
    }
}
