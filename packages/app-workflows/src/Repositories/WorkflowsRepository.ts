import type { IWorkflowsRepository } from "./abstractions/WorkflowsRepository.js";
import type { IWorkflowModel } from "../Models/index.js";
import { WorkflowModel } from "../Models/index.js";
import type { IWorkflow } from "~/types.js";
import { makeAutoObservable, observable, runInAction } from "mobx";
import type { IWorkflowsGateway } from "../Gateways/index.js";
import type { IWorkflowError } from "~/Gateways/abstraction/WorkflowsGateway.js";

export interface IWorkflowsRepositoryParams {
    gateway: IWorkflowsGateway;
    defaultWorkflow: IWorkflow;
}

export class WorkflowsRepository implements IWorkflowsRepository {
    public readonly workflows;
    private _loading: boolean = true;
    private _error: IWorkflowError | null = null;
    private readonly gateway;
    private readonly defaultWorkflow;

    public get error(): IWorkflowError | null {
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
        const result = await this.gateway.listWorkflows();

        const workflows: IWorkflow[] = result.data || [];
        if (workflows.length === 0 && !result.error) {
            workflows.push(this.defaultWorkflow);
        }
        runInAction(() => {
            this._error = result.error;
            this._loading = false;
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

    public async save(input: IWorkflow): Promise<void> {
        const index = this.workflows.findIndex(w => w.id === input.id);
        const workflow = this.workflows[index] || new WorkflowModel(input);
        runInAction(() => {
            this._loading = true;
            this._error = null;
            if (index === -1) {
                this.workflows.push(workflow);
            } else {
                workflow.id = input.id;
                workflow.name = input.name;
                workflow.setSteps(input.steps);
            }
        });
        const result = await this.gateway.storeWorkflow(workflow);

        runInAction(() => {
            this._loading = false;
            this._error = result.error;
        });
    }

    public async remove(id: string): Promise<void> {
        const index = this.workflows.findIndex(w => w.id === id);
        if (index === -1) {
            return;
        }
        const workflow = this.workflows[index];
        runInAction(() => {
            this._loading = true;
            this._error = null;
            this.workflows.splice(index, 1);
        });
        const result = await this.gateway.deleteWorkflow(workflow);
        runInAction(() => {
            this._loading = false;
            this._error = result.error;
            if (result.error) {
                this.workflows.splice(index, 0, workflow);
            } else if (this.workflows.length === 0) {
                this.workflows.push(new WorkflowModel(this.defaultWorkflow));
            }
        });
    }

    public list(): IWorkflowModel[] {
        return this.workflows;
    }
}
