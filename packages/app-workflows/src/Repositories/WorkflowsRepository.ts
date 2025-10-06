import type { IWorkflowsRepository } from "./abstractions/index.js";
import type { IWorkflowModel } from "../Models/index.js";
import type { IWorkflow } from "~/types.js";
import { makeAutoObservable, observable, runInAction } from "mobx";
import { WorkflowModel } from "../Models/WorkflowModel.js";
import type { IWorkflowsGateway } from "../Gateways/index.js";

export interface IWorkflowsRepositoryParams {
    gateway: IWorkflowsGateway;
    defaultWorkflow: IWorkflow;
}

export class WorkflowsRepository implements IWorkflowsRepository {
    private _loading: boolean = false;
    private _error: Error | null = null;
    private readonly gateway;
    private readonly workflows;
    private readonly defaultWorkflow;

    public get error(): Error | null {
        return this._error;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public constructor(params: IWorkflowsRepositoryParams) {
        this.gateway = params.gateway;
        this.defaultWorkflow = params.defaultWorkflow;
        this.workflows = observable.array<IWorkflowModel>([
            new WorkflowModel(this.defaultWorkflow)
        ]);
        makeAutoObservable(this);
    }

    public async init() {
        let workflows: IWorkflow[] = [];
        try {
            runInAction(() => {
                this._loading = true;
            })
            workflows = await this.gateway.listWorkflows();
            this._error = null;
        } catch (ex) {
            this._error = ex;
        }
        if (!workflows.length) {
            workflows = [this.defaultWorkflow];
        }
        this._loading = false;
        runInAction(() => {
            this.workflows.replace(workflows.map(w => new WorkflowModel(w)));
        });
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
            const workflow = this.workflows.find(w => w.id === input.id);
            if (!workflow) {
                this.workflows.push(new WorkflowModel(input));
            } else {
                workflow.id = input.id;
                workflow.name = input.name;
                workflow.setSteps(input.steps);
            }
            this.gateway.storeWorkflows(this.workflows);
        });
    }

    public remove(id: string): void {
        runInAction(() => {
            const index = this.workflows.findIndex(w => w.id === id);
            if (index === -1) {
                return;
            }
            this.workflows.splice(index, 1);

            this.gateway.storeWorkflows(this.workflows);
        });
    }

    public list(): IWorkflowModel[] {
        // Return the observable array directly if consumer expects reactivity
        return this.workflows;
    }
}
