import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import { WorkflowStepModel } from "./WorkflowStepModel.js";
import type { IWorkflowModel } from "./abstractions/WorkflowModel.js";
import type { IWorkflowStepModel } from "./abstractions/WorkflowStepModel.js";
import type { IWorkflow, IWorkflowStep } from "~/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";

const createSnapshot = (data: IWorkflow) => {
    return JSON.stringify({
        id: data.id,
        app: data.app,
        name: data.name,
        steps: data.steps.map(step => ({
            id: step.id,
            title: step.title,
            color: step.color,
            description: step.description,
            teams: step.teams.map(team => ({ id: team.id })),
            notifications: step.notifications
                ? step.notifications.map(notification => ({ id: notification.id }))
                : undefined
        }))
    });
};

export class WorkflowModel implements IWorkflowModel {
    private snapshot: string;
    public id;
    public app;
    public name;
    public steps;

    public get dirty(): boolean {
        return this.snapshot !== createSnapshot(this.toJS());
    }

    public constructor(data: IWorkflow) {
        this.snapshot = createSnapshot(data);
        this.id = data.id;
        this.app = data.app;
        this.name = data.name;
        this.steps = observable.array<IWorkflowStepModel>();

        this.steps.replace(
            data.steps.map(step => {
                return new WorkflowStepModel(step);
            })
        );

        makeAutoObservable(this);
    }

    public toJS(): IWorkflow {
        return toJS({
            id: this.id,
            app: this.app,
            name: this.name,
            steps: this.steps.map(s => s.toJS()) as NonEmptyArray<IWorkflowStep>
        });
    }

    public setSteps(steps: IWorkflowStep[]) {
        runInAction(() => {
            this.steps.replace(
                steps.map(step => {
                    return new WorkflowStepModel(step);
                })
            );
        });
    }

    public addStep(step: IWorkflowStep) {
        runInAction(() => {
            this.steps.push(new WorkflowStepModel(step));
        });
    }

    public updateStep(step: IWorkflowStep) {
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
