import type { IWorkflowStep, IWorkflowStepNotification, IWorkflowStepTeam } from "~/types.js";
import { makeAutoObservable, observable } from "mobx";
import { WorkflowStepTeam } from "./WorkflowStepTeam.js";
import { WorkflowStepNotification } from "./WorkflowStepNotification.js";
import type { IWorkflowStepTeamModel } from "./abstractions/WorkflowStepTeamModel.js";
import type { IWorkflowStepNotificationModel } from "./abstractions/WorkflowStepNotificationModel.js";

export class WorkflowStep {
    public id: string;
    public title: string;
    public color: string;
    public description?: string;
    public teams: IWorkflowStepTeamModel[];
    public notifications: IWorkflowStepNotificationModel[];

    public constructor(data: IWorkflowStep) {
        this.id = data.id;
        this.title = data.title;
        this.color = data.color;
        this.description = data.description;
        this.teams = observable.array(data.teams.map(t => new WorkflowStepTeam(t)));
        this.notifications = observable.array(
            (data.notifications || []).map(n => new WorkflowStepNotification(n))
        );

        makeAutoObservable(this, {}, { autoBind: true });
    }

    public addTeam(team: IWorkflowStepTeam) {
        this.teams.push(new WorkflowStepTeam(team));
    }

    public removeTeam(teamId: string) {
        const index = this.teams.findIndex(t => t.id === teamId);
        if (index === -1) {
            return;
        }
        this.teams.splice(index, 1);
    }

    public addNotification(notification: IWorkflowStepNotification) {
        this.notifications.push(new WorkflowStepNotification(notification));
    }

    public removeNotification(id: string) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) {
            return;
        }
        this.notifications.splice(index, 1);
    }
}
