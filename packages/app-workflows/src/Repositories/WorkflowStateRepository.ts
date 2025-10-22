import type {
    IWorkflowStateRepository,
    IWorkflowStateRepositoryApproveParams,
    IWorkflowStateRepositoryFindOneParams,
    IWorkflowStateRepositoryRejectParams,
    IWorkflowStateRepositoryRequestReviewParams,
    IWorkflowStateRepositoryStartParams
} from "./abstractions/WorkflowStateRepository.js";
import type {
    IWorkflowStateError,
    IWorkflowStateGateway
} from "~/Gateways/abstraction/WorkflowStateGateway.js";
import { makeAutoObservable, runInAction } from "mobx";
import { IWorkflowState } from "~/types.js";

export interface IWorkflowStateRepositoryParams {
    gateway: IWorkflowStateGateway;
}

export class WorkflowStateRepository implements IWorkflowStateRepository {
    private readonly gateway;
    private _error: IWorkflowStateError | null = null;
    private _loading: boolean = false;

    public get error(): IWorkflowStateError | null {
        return this._error;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public constructor(params: IWorkflowStateRepositoryParams) {
        this.gateway = params.gateway;

        makeAutoObservable(this);
    }

    public async start(
        params: IWorkflowStateRepositoryStartParams
    ): Promise<IWorkflowState | null> {
        runInAction(() => {
            this._loading = true;
            this._error = null;
        });
        const result = await this.gateway.startWorkflowStateStep(params);
        runInAction(() => {
            this._error = result.error;
            this._loading = false;
        });
        return result.data;
    }

    public async approve(
        params: IWorkflowStateRepositoryApproveParams
    ): Promise<IWorkflowState | null> {
        runInAction(() => {
            this._loading = true;
            this._error = null;
        });
        const result = await this.gateway.approveWorkflowStateStep(params);
        runInAction(() => {
            this._error = result.error;
            this._loading = false;
        });
        return result.data;
    }

    public async reject(
        params: IWorkflowStateRepositoryRejectParams
    ): Promise<IWorkflowState | null> {
        runInAction(() => {
            this._loading = true;
            this._error = null;
        });
        const result = await this.gateway.rejectWorkflowStateStep(params);
        runInAction(() => {
            this._error = result.error;
            this._loading = false;
        });
        return result.data;
    }

    public async cancel(id: string): Promise<void> {
        runInAction(() => {
            this._loading = true;
            this._error = null;
        });
        const result = await this.gateway.cancelWorkflowState(id);
        runInAction(() => {
            this._error = result.error;
            this._loading = false;
        });
    }

    public async findOne(
        params: IWorkflowStateRepositoryFindOneParams
    ): Promise<IWorkflowState | null> {
        const { app, targetRevisionId } = params;
        runInAction(() => {
            this._loading = true;
            this._error = null;
        });
        const result = await this.gateway.listWorkflowStates({
            where: {
                app,
                targetRevisionId
            },
            limit: 1
        });
        runInAction(() => {
            this._error = result.error;
            this._loading = false;
        });
        return result.data?.[0] || null;
    }

    public async requestReview(
        params: IWorkflowStateRepositoryRequestReviewParams
    ): Promise<IWorkflowState | null> {
        const { app, targetRevisionId } = params;
        runInAction(() => {
            this._loading = true;
            this._error = null;
        });
        const result = await this.gateway.createWorkflowState({
            app,
            targetRevisionId
        });
        runInAction(() => {
            this._error = result.error;
            this._loading = false;
        });
        return result.data || null;
    }

    public async getTargetState(
        app: string,
        targetRevisionId: string
    ): Promise<IWorkflowState | null> {
        runInAction(() => {
            this._loading = true;
            this._error = null;
        });
        const result = await this.gateway.getTargetWorkflowState(app, targetRevisionId);
        runInAction(() => {
            this._error = result.error;
            this._loading = false;
        });
        return result.data || null;
    }
}
