import type { IObservableArray } from "mobx";
import { makeAutoObservable, observable, runInAction } from "mobx";
import { WorkflowStep } from "./WorkflowStep.js";
import type { IWorkflowModel } from "./abstractions/WorkflowModel.js";
import { IWorkflowStepModel } from "./abstractions/WorkflowStepModel.js";
import { IWorkflow, type IWorkflowStep } from "~/types.js";

export class Workflow implements IWorkflowModel {
    public id: string;
    public name: string;
    public steps: IObservableArray<IWorkflowStepModel>;

    public constructor(data: IWorkflow) {
        this.id = data.id;
        this.name = data.name;
        this.steps = observable.array<IWorkflowStepModel>();

        for (const step of data.steps) {
            this.addStep(step);
        }
        makeAutoObservable(this);
    }

    public addStep(step: IWorkflowStep) {
        runInAction(() => {
            this.steps.push(new WorkflowStep(step, this.steps));
        });
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
