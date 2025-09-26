import type { IWorkflowStep, IWorkflowStepNotification, IWorkflowStepTeam } from "~/types.js";
import type { IObservableArray } from "mobx";
import { makeAutoObservable, observable, runInAction } from "mobx";
import { WorkflowStepTeam } from "./WorkflowStepTeam.js";
import { WorkflowStepNotification } from "./WorkflowStepNotification.js";
import type { IWorkflowStepTeamModel } from "./abstractions/WorkflowStepTeamModel.js";
import type { IWorkflowStepNotificationModel } from "./abstractions/WorkflowStepNotificationModel.js";
import {
    IWorkflowStepModel
} from "~/admin/plugins/editor/publishingWorkflows/models/abstractions/WorkflowStepModel.js";

export class WorkflowStep {
    public id: string;
    public title: string;
    public color: string;
    public description?: string;
    public teams: IObservableArray<IWorkflowStepTeamModel>;
    public notifications: IObservableArray<IWorkflowStepNotificationModel>;

    private readonly parentSteps: IObservableArray<IWorkflowStepModel>;

    public constructor(data: IWorkflowStep, parentSteps: IObservableArray<IWorkflowStepModel>) {
        this.id = data.id;
        this.title = data.title;
        this.color = data.color;
        this.description = data.description;
        this.parentSteps = parentSteps;
        this.teams = observable.array(data.teams.map(t => new WorkflowStepTeam(t)));
        this.notifications = observable.array(
            (data.notifications || []).map(n => new WorkflowStepNotification(n))
        );

        makeAutoObservable(this);
    }

    public updateStep(input: Partial<IWorkflowStep>) {
        runInAction(() => {
            if (input.title !== undefined) {
                this.title = input.title;
            }
            if (input.color !== undefined) {
                this.color = input.color;
            }
            if (input.description !== undefined) {
                this.description = input.description;
            }
            if (input.teams !== undefined) {
                this.teams.replace(input.teams.map(t => new WorkflowStepTeam(t)));
            }
            if (input.notifications !== undefined) {
                this.notifications.replace(
                    input.notifications.map(n => new WorkflowStepNotification(n))
                );
            }
        });
    }

    public addTeam(team: IWorkflowStepTeam) {
        runInAction(() => {
            this.teams.push(new WorkflowStepTeam(team));
        });
    }

    public removeTeam(teamId: string) {
        const index = this.teams.findIndex(t => t.id === teamId);
        if (index === -1) {
            return;
        }
        runInAction(() => {
            this.teams.splice(index, 1);
        });
    }

    public addNotification(notification: IWorkflowStepNotification) {
        runInAction(() => {
            this.notifications.push(new WorkflowStepNotification(notification));
        });
    }

    public removeNotification(id: string) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) {
            return;
        }
        runInAction(() => {
            this.notifications.splice(index, 1);
        });
    }

    public moveUp(): void {
        const index = this.parentSteps.findIndex(s => s.id === this.id);
        if (index > 0) {
            [this.parentSteps[index - 1], this.parentSteps[index]] = [
                this.parentSteps[index],
                this.parentSteps[index - 1]
            ];
        }
    }

    public canMoveUp(): boolean {
        const index = this.parentSteps.findIndex(s => s.id === this.id);
        return index > 0;
    }

    public moveDown(): void {
        const index = this.parentSteps.findIndex(s => s.id === this.id);
        if (index !== -1 && index < this.parentSteps.length - 1) {
            [this.parentSteps[index], this.parentSteps[index + 1]] = [
                this.parentSteps[index + 1],
                this.parentSteps[index]
            ];
        }
    }

    public canMoveDown(): boolean {
        const index = this.parentSteps.findIndex(s => s.id === this.id);
        return index !== -1 && index < this.parentSteps.length - 1;
    }
}
