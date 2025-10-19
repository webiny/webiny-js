import type { IWorkflowStateStep, IWorkflowStep } from "~/types.js";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import type { IWorkflowStateStepModel } from "./abstractions/WorkflowStateStepModel.js";

export class WorkflowStateStepModel implements IWorkflowStateStepModel {
    public id;
    public comment;
    public savedBy;
    public state;
    public title;
    public teams;
    public notifications;
    public color;
    public description;

    public constructor(data: IWorkflowStateStep, workflowStep: IWorkflowStep) {
        this.id = data.id;
        this.comment = data.comment;
        this.savedBy = data.savedBy;
        this.state = data.state;
        this.title = workflowStep.title;
        this.teams = workflowStep.teams;
        this.notifications = workflowStep.notifications;
        this.color = workflowStep.color;
        this.description = workflowStep.description;

        makeAutoObservable(this);
    }

    public toJS(): IWorkflowStateStep {
        return toJS({
            id: this.id,
            comment: this.comment,
            savedBy: this.savedBy,
            state: this.state
        });
    }

    public updateStep(input: Partial<IWorkflowStateStep>) {
        runInAction(() => {
            Object.assign(this, input);
        });
    }
}
