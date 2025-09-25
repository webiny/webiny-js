import { makeAutoObservable, observable } from "mobx";
import { WorkflowStep } from "./WorkflowStep.js";
import type { IWorkflowModel } from "./abstractions/WorkflowModel.js";
import { IWorkflowStepModel } from "./abstractions/WorkflowStepModel.js";
import { IWorkflow, type IWorkflowStep } from "~/types.js";

export class Workflow implements IWorkflowModel {
    public id: string;
    public name: string;
    public steps: IWorkflowStepModel[];

    public constructor(data: IWorkflow) {
        this.id = data.id;
        this.name = data.name;
        this.steps = observable.array(data.steps.map(s => new WorkflowStep(s)));
        makeAutoObservable(this, {}, { autoBind: true });
    }

    public addStep(step: IWorkflowStep) {
        this.steps.push(new WorkflowStep(step));
    }

    public removeStep(id: string) {
        const index = this.steps.findIndex(s => s.id === id);
        if (index === -1) {
            return;
        }
        this.steps.splice(index, 1);
    }

    public findStep(id: string) {
        return this.steps.find(s => s.id === id);
    }
}
