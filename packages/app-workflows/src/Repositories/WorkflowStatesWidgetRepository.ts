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
    #loading;
    #error;
    readonly #gateway;

    public get loading(): boolean {
        for (const key in this.#loading) {
            if (this.#loading[key]) {
                return true;
            }
        }
        return false;
    }

    public get error(): IGenericError | null {
        const errors = Object.keys(this.#error).filter(key => !!this.#error[key]);
        if (errors.length === 0) {
            return null;
        }
        return {
            message: "One or more errors occurred.",
            code: "MULTIPLE_ERRORS",
            data: this.#error
        };
    }

    public constructor(params: IWorkflowStatesWidgetRepositoryParams) {
        this.#gateway = params.gateway;
        this.#error = observable.object<IError>({});
        this.#loading = observable.object<ILoading>({});

        makeAutoObservable(this);
    }

    public async listOwnStates(
        state: WorkflowStateValue
    ): Promise<IWorkflowStatesWidgetRepositoryListResult> {
        const key = `own.${state}`;
        runInAction(() => {
            this.#loading[key] = true;
            this.#error[key] = null;
        });
        const result = await this.#gateway.listOwnStates({
            where: {
                state
            },
            limit: 5
        });
        runInAction(() => {
            this.#loading[key] = false;
            this.#error[key] = result.error;
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
            this.#loading[key] = true;
            this.#error[key] = null;
        });
        const result = await this.#gateway.listRequestedStates({
            where: {
                state
            },
            limit: 5
        });
        runInAction(() => {
            this.#loading[key] = false;
            this.#error[key] = result.error;
        });
        return {
            items: result.data || [],
            totalCount: result.meta?.totalCount || 0
        };
    }

    public async approveState(
        params: IWorkflowStatesWidgetRepositoryApproveStateParams
    ): Promise<IWorkflowState | null> {
        const key = `approve.${params.id}`;
        runInAction(() => {
            this.#loading[key] = true;
            this.#error[key] = null;
        });
        const result = await this.#gateway.approveState(params);
        runInAction(() => {
            this.#loading[key] = false;
            this.#error[key] = result.error;
        });
        return result.data || null;
    }

    public async declineState(
        params: IWorkflowStatesWidgetRepositoryDeclineStateParams
    ): Promise<IWorkflowState | null> {
        const key = `decline.${params.id}`;
        runInAction(() => {
            this.#loading[key] = true;
            this.#error[key] = null;
        });
        const result = await this.#gateway.declineState(params);
        runInAction(() => {
            this.#loading[key] = false;
            this.#error[key] = result.error;
        });
        return result.data || null;
    }
}
