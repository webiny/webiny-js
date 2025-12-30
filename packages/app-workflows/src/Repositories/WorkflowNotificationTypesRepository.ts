import type { IWorkflowNotificationTypesRepository } from "./abstractions/WorkflowNotificationTypesRepository.js";
import { makeAutoObservable, runInAction } from "mobx";
import type { IWorkflowNotificationType } from "~/types.js";
import type { IWorkflowNotificationTypesGateway } from "~/Gateways/abstraction/WorkflowNotificationTypesGateway.js";
import type { IWorkflowError } from "~/Gateways/index.js";

export interface IWorkflowNotificationTypesRepositoryParams {
    gateway: IWorkflowNotificationTypesGateway;
}

export class WorkflowNotificationTypesRepository implements IWorkflowNotificationTypesRepository {
    private readonly gateway;
    private _loading: boolean = true;
    private _error: IWorkflowError | null = null;

    public get error(): IWorkflowError | null {
        return this._error;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public constructor(params: IWorkflowNotificationTypesRepositoryParams) {
        this.gateway = params.gateway;

        makeAutoObservable(this);
    }

    public async list(): Promise<IWorkflowNotificationType[]> {
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
