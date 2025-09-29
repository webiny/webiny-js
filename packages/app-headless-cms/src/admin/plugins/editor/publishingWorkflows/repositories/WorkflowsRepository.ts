import type { IWorkflowsRepository } from "./abstractions/WorkflowsRepiository.js";
import type { IWorkflowModel } from "../models/index.js";
import type { IWorkflow } from "~/types.js";
import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import { WorkflowModel } from "../models/WorkflowModel.js";
import type { IWorkflowsGateway } from "../gateways/index.js";

export interface IWorkflowsRepositoryParams {
    gateway: IWorkflowsGateway;
}

export class WorkflowsRepository implements IWorkflowsRepository {
    private readonly gateway;
    private readonly workflows: IWorkflowModel[];

    public constructor(params: IWorkflowsRepositoryParams) {
        this.gateway = params.gateway;
        this.workflows = observable.array(
            this.gateway.getWorkflows().map(w => new WorkflowModel(w))
        );
        makeAutoObservable(this);
    }

    public find(id: string): IWorkflowModel | null {
        return this.workflows.find(w => w.id === id) || null;
    }

    public findOne(id: string): IWorkflowModel {
        const workflow = this.find(id);
        if (!workflow) {
            throw new Error(`Workflow with id "${id}" was not found!`);
        }
        return workflow;
    }

    public save(input: IWorkflow): void {
        runInAction(() => {
            const index = this.workflows.findIndex(w => w.id === input.id);
            if (index >= 0) {
                // Replace with a new Workflow model to keep it reactive
                this.workflows[index] = new WorkflowModel(input);
                return;
            }
            this.workflows.push(new WorkflowModel(input));

            this.gateway.storeWorkflows(toJS(this.workflows));
        });
    }

    public remove(id: string): void {
        runInAction(() => {
            const index = this.workflows.findIndex(w => w.id === id);
            if (index === -1) {
                return;
            }
            this.workflows.splice(index, 1);

            this.gateway.storeWorkflows(toJS(this.workflows));
        });
    }

    public list(): IWorkflowModel[] {
        // Return the observable array directly if consumer expects reactivity
        return this.workflows;
    }
}
