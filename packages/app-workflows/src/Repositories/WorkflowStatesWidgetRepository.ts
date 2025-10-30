import { makeAutoObservable, observable, runInAction } from "mobx";
import type {
    IWorkflowStatesWidgetRepository,
    IWorkflowStatesWidgetRepositoryApproveStateParams,
    IWorkflowStatesWidgetRepositoryDeclineStateParams,
    IWorkflowStatesWidgetRepositoryListResult
} from "./abstractions/WorkflowStatesWidgetRepository.js";
import type { IWorkflowStatesWidgetGateway } from "~/Gateways/index.js";
import { type IGenericError, type IWorkflowState, WorkflowStateValue } from "~/types.js";

export interface IWorkflowStatesWidgetRepositoryParams {
    gateway: IWorkflowStatesWidgetGateway;
}

interface ILoading {
    [key: string]: boolean;
}

interface IError {
    [key: string]: IGenericError | null;
}

export class WorkflowStatesWidgetRepository implements IWorkflowStatesWidgetRepository {
    private readonly _loading;
    private readonly _error;
    private _actionLoading: boolean = false;
    private _actionError: IGenericError | null = null;
    private readonly gateway;

    public get actionLoading(): boolean {
        return this._actionLoading;
    }

    public get actionError(): IGenericError | null {
        return this._actionError;
    }

    public get loading(): boolean {
        for (const key in this._loading) {
            if (this._loading[key]) {
                return true;
            }
        }
        return false;
    }

    public get error(): IGenericError | null {
        const errors = Object.keys(this._error).filter(key => !!this._error[key]);
        if (errors.length === 0) {
            return null;
        }
        return {
            message: "One or more errors occurred.",
            code: "MULTIPLE_ERRORS",
            data: this._error
        };
    }

    public constructor(params: IWorkflowStatesWidgetRepositoryParams) {
        this.gateway = params.gateway;
        this._error = observable.object<IError>({});
        this._loading = observable.object<ILoading>({});

        makeAutoObservable(this);
    }

    public async listOwnStates(
        state: WorkflowStateValue
    ): Promise<IWorkflowStatesWidgetRepositoryListResult> {
        const key = `own.${state}`;
        runInAction(() => {
            this._loading[key] = true;
            this._error[key] = null;
        });
        const result = await this.gateway.listOwnStates({
            where: {
                state
            },
            limit: 5
        });
        runInAction(() => {
            this._loading[key] = false;
            this._error[key] = result.error;
        });
        return {
            items: result.data || [],
            totalCount: result.meta?.totalCount || 0
        };
    }

    public async listRequestedStates(
        state: WorkflowStateValue
    ): Promise<IWorkflowStatesWidgetRepositoryListResult> {
        const key = `requested.${state}`;
        runInAction(() => {
            this._loading[key] = true;
            this._error[key] = null;
        });
        const result = await this.gateway.listRequestedStates({
            where: {
                state
            },
            limit: 5
        });
        runInAction(() => {
            this._loading[key] = false;
            this._error[key] = result.error;
        });
        return {
            items: result.data || [],
            totalCount: result.meta?.totalCount || 0
        };
    }

    public async approveState(
        params: IWorkflowStatesWidgetRepositoryApproveStateParams
    ): Promise<IWorkflowState | null> {
        runInAction(() => {
            this._actionLoading = true;
            this._actionError = null;
        });
        const result = await this.gateway.approveState(params);
        runInAction(() => {
            this._actionLoading = false;
            this._actionError = result.error;
        });
        return result.data || null;
    }

    public async declineState(
        params: IWorkflowStatesWidgetRepositoryDeclineStateParams
    ): Promise<IWorkflowState | null> {
        runInAction(() => {
            this._actionLoading = true;
            this._actionError = null;
        });
        const result = await this.gateway.declineState(params);
        runInAction(() => {
            this._actionLoading = false;
            this._actionError = result.error;
        });
        return result.data || null;
    }
}
