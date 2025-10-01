import type { IWorkflowStep, IWorkflowStepNotification, IWorkflowStepTeam } from "~/types.js";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import type { IWorkflowStepModel } from "./abstractions/WorkflowStepModel.js";

export class WorkflowStepModel implements IWorkflowStepModel {
    public id: string;
    public title: string;
    public color: string;
    public description?: string;
    public teams: IWorkflowStepTeam[];
    public notifications: IWorkflowStepNotification[];

    public constructor(data: IWorkflowStep) {
        this.id = data.id;
        this.title = data.title;
        this.color = data.color;
        this.description = data.description;
        this.teams = data.teams;
        this.notifications = data.notifications || [];

        makeAutoObservable(this);
    }

    public toJS(): IWorkflowStep {
        return toJS({
            id: this.id,
            title: this.title,
            color: this.color,
            description: this.description,
            teams: this.teams,
            notifications: this.notifications
        });
    }

    public updateStep(input: Partial<IWorkflowStep>) {
        runInAction(() => {
            Object.assign(this, input);
        });
    }
}
