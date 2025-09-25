import type { IWorkflowsRepository } from "./abstractions/WorkflowsRepiository.js";
import type { IWorkflowModel } from "../models/abstractions/WorkflowModel.js";
import type { IWorkflow } from "~/types.js";
import { makeAutoObservable, observable, runInAction } from "mobx";
import { Workflow } from "../models/Workflow.js";

export interface IWorkflowsRepositoryParams {
    workflows: IWorkflow[];
}

export class WorkflowsRepository implements IWorkflowsRepository {
    private readonly workflows: IWorkflowModel[];

    public constructor(params: IWorkflowsRepositoryParams) {
        this.workflows = observable.array(params.workflows.map(w => new Workflow(w)));
        makeAutoObservable(this, {}, { autoBind: true });
    }

    public find(id: string): IWorkflowModel | null {
        return this.workflows.find(w => w.id === id) || null;
    }

    public save(input: IWorkflow): void {
        runInAction(() => {
            const index = this.workflows.findIndex(w => w.id === input.id);
            if (index >= 0) {
                // Replace with a new Workflow model to keep it reactive
                this.workflows[index] = new Workflow(input);
                return;
            }
            this.workflows.push(new Workflow(input));
        });
    }

    public remove(id: string): void {
        runInAction(() => {
            const index = this.workflows.findIndex(w => w.id === id);
            if (index === -1) {
                return;
            }
            this.workflows.splice(index, 1);
        });
    }

    public list(): IWorkflow[] {
        // Return the observable array directly if consumer expects reactivity
        return this.workflows;
    }
}
