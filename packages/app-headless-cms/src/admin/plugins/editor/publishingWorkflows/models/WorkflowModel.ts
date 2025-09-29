import type { IObservableArray } from "mobx";
import { makeAutoObservable, observable, runInAction } from "mobx";
import { WorkflowStepModel } from "./WorkflowStepModel.js";
import type { IWorkflowModel } from "./abstractions/WorkflowModel.js";
import type { IWorkflowStepModel } from "./abstractions/WorkflowStepModel.js";
import type { IWorkflow, IWorkflowStep } from "~/types.js";

export class WorkflowModel implements IWorkflowModel {
    public id: string;
    public name: string;
    public steps: IObservableArray<IWorkflowStepModel>;

    public constructor(data: IWorkflow) {
        this.id = data.id;
        this.name = data.name;
        this.steps = observable.array<IWorkflowStepModel>();
        
        this.steps.replace(
            data.steps.map(step => {
                return new WorkflowStepModel(step, this.steps);
            })
        );

        makeAutoObservable(this);
    }

    public addStep(step: IWorkflowStep) {
        runInAction(() => {
            this.steps.push(new WorkflowStepModel(step, this.steps));
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
