import type {
    IWorkflowsRepository,
    IWorkflowsRepositoryListParams
} from "./abstractions/WorkflowsRepository.js";
import type { IWorkflow } from "~/types.js";
import { type IObservableArray, makeAutoObservable, observable, runInAction, toJS } from "mobx";
import type { IWorkflowsGateway } from "../Gateways/index.js";
import type { IWorkflowError } from "~/Gateways/abstraction/WorkflowsGateway.js";

export interface IWorkflowsRepositoryParams {
    gateway: IWorkflowsGateway;
}

export class WorkflowsRepository implements IWorkflowsRepository {
    private workflows: IObservableArray<IWorkflow>;
    private _loading: boolean = true;
    private _error: IWorkflowError | null = null;
    private readonly gateway;

    public get error(): IWorkflowError | null {
        return this._error;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public constructor(params: IWorkflowsRepositoryParams) {
        this.gateway = params.gateway;
        this.workflows = observable.array<IWorkflow>([]);

        makeAutoObservable(this);
    }

    public find(id: string): IWorkflow | null {
        return toJS(this.workflows.find(w => w.id === id) || null);
    }

    public findOne(id: string): IWorkflow {
        const workflow = this.find(id);
        if (!workflow) {
            throw new Error(`Workflow with id "${id}" was not found!`);
        }
        return workflow;
    }

    public async save(input: IWorkflow): Promise<void> {
        const index = this.workflows.findIndex(w => w.id === input.id);
        const workflow = toJS(this.workflows[index] || input);
        runInAction(() => {
            this._loading = true;
            this._error = null;
            if (index === -1) {
                this.workflows.push(input);
            } else {
                this.workflows[index] = input;
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
            }
        });
    }

    public async listWorkflows(params?: IWorkflowsRepositoryListParams): Promise<IWorkflow[]> {
        runInAction(() => {
            this._loading = true;
            this._error = null;
        });
        const result = await this.gateway.listWorkflows(params);
        runInAction(() => {
            this._loading = false;
            this._error = result.error;
            this.workflows.replace(result.data || []);
        });
        return toJS(this.workflows);
    }
}
