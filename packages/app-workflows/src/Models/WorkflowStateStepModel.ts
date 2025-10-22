import type { IWorkflowStateStep } from "~/types.js";
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

    public constructor(params: IWorkflowStateStep) {
        this.id = params.id;
        this.title = params.title;
        this.color = params.color;
        this.description = params.description;
        this.notifications = params.notifications;
        this.teams = params.teams;
        this.comment = params.comment;
        this.savedBy = params.savedBy;
        this.state = params.state;

        makeAutoObservable(this);
    }

    public toJS(): IWorkflowStateStep {
        return toJS({
            id: this.id,
            comment: this.comment,
            savedBy: this.savedBy,
            state: this.state,
            title: this.title,
            notifications: this.notifications,
            teams: this.teams,
            color: this.color,
            description: this.description
        });
    }

    public updateStep(input: Partial<IWorkflowStateStep>) {
        runInAction(() => {
            Object.assign(this, input);
        });
    }
}
