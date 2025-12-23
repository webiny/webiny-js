import type { IWorkflowNotificationsRepository } from "./abstractions/WorkflowNotificationsRepository.js";
import { makeAutoObservable, runInAction } from "mobx";
import type { IWorkflowNotification } from "~/types.js";
import type { IWorkflowNotificationsGateway } from "~/Gateways/abstraction/WorkflowNotificationsGateway.js";
import type { IWorkflowError } from "~/Gateways/index.js";

export interface IWorkflowNotificationsRepositoryParams {
    gateway: IWorkflowNotificationsGateway;
}

export class WorkflowNotificationsRepository implements IWorkflowNotificationsRepository {
    private readonly gateway;
    private _loading: boolean = true;
    private _error: IWorkflowError | null = null;

    public get error(): IWorkflowError | null {
        return this._error;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public constructor(params: IWorkflowNotificationsRepositoryParams) {
        this.gateway = params.gateway;

        makeAutoObservable(this);
    }

    public async list(): Promise<IWorkflowNotification[]> {
        runInAction(() => {
            this._loading = true;
            this._error = null;
        });

        const results = await this.gateway.list();

        runInAction(() => {
            this._loading = false;
            this._error = results.error;
        });
        return results.data || [];
    }
}
