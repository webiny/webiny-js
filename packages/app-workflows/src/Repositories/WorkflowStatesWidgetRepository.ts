import { makeAutoObservable, runInAction } from "mobx";
import type { IWorkflowStatesWidgetRepository } from "./abstractions/WorkflowStatesWidgetRepository.js";
import type { IWorkflowStatesWidgetGateway } from "~/Gateways/index.js";
import { type IGenericError, type IWorkflowStatesWidgetItem, WorkflowStateValue } from "~/types.js";

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
    /**
     * We need to track which state is loading and for which type of request (own/requested)
     */
    #loading: ILoading = {};
    #error: IError = {};
    readonly #gateway: IWorkflowStatesWidgetGateway;

    public get loading(): boolean {
        const keys = Object.keys(this.#loading);
        return keys.some(key => this.#loading[key]);
    }
    public get error(): IGenericError | null {
        const errors = Object.keys(this.#error).filter(key => this.#error[key] !== null);
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

        makeAutoObservable(this);
    }

    public async listOwnStates(state: WorkflowStateValue): Promise<IWorkflowStatesWidgetItem[]> {
        const key = `own.${state}`;
        runInAction(() => {
            this.#loading[key] = true;
            this.#error[key] = null;
        });
        const result = await this.#gateway.listOwnStates({
            where: {
                state
            }
        });
        runInAction(() => {
            this.#loading[key] = false;
            this.#error[key] = result.error;
        });
        return result.data || [];
    }

    public async listRequestedStates(
        state: WorkflowStateValue
    ): Promise<IWorkflowStatesWidgetItem[]> {
        const key = `requested.${state}`;
        runInAction(() => {
            this.#loading[key] = true;
            this.#error[key] = null;
        });
        const result = await this.#gateway.listRequestedStates({
            where: {
                state
            }
        });
        runInAction(() => {
            this.#loading[key] = false;
            this.#error[key] = result.error;
        });
        return result.data || [];
    }
}
