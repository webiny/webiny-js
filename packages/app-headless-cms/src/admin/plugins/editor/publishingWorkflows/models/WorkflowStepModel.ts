import type { IWorkflowStep, IWorkflowStepNotification, IWorkflowStepTeam } from "~/types.js";
import type { IObservableArray } from "mobx";
import { makeAutoObservable, runInAction } from "mobx";
import type { IWorkflowStepModel } from "./abstractions/WorkflowStepModel.js";

export class WorkflowStepModel {
    public id: string;
    public title: string;
    public color: string;
    public description?: string;
    public teams: IWorkflowStepTeam[];
    public notifications: IWorkflowStepNotification[];

    private readonly parentSteps: IObservableArray<IWorkflowStepModel>;

    public constructor(data: IWorkflowStep, parentSteps: IObservableArray<IWorkflowStepModel>) {
        this.id = data.id;
        this.title = data.title;
        this.color = data.color;
        this.description = data.description;
        this.parentSteps = parentSteps;
        this.teams = data.teams;
        this.notifications = data.notifications || [];

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
                this.teams = input.teams;
            }
            if (input.notifications !== undefined) {
                this.notifications = input.notifications;
            }
        });
    }

    public addTeam(team: IWorkflowStepTeam) {
        runInAction(() => {
            this.teams.push(team);
        });
    }

    public removeTeam(id: string) {
        const index = this.teams.findIndex(t => t.id === id);
        if (index === -1) {
            return;
        }
        runInAction(() => {
            this.teams.splice(index, 1);
        });
    }

    public addNotification(notification: IWorkflowStepNotification) {
        runInAction(() => {
            this.notifications.push(notification);
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
