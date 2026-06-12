import { makeAutoObservable, runInAction } from "mobx";
import { ListWorkflowStatesUseCase } from "~/features/listWorkflowStates/abstractions.js";
import type { IGenericError, IGenericMeta, IWorkflowState } from "~/types.js";
import {
    WorkflowStateListPresenter as Abstraction,
    type IWorkflowStateListPresenter,
    type IWorkflowStateListPresenterViewModel,
    type IWorkflowStateListPresenterListParams,
    type IWorkflowStateListPresenterListParamsWhere,
    type WorkflowStateListType
} from "./abstractions.js";

class WorkflowStateListPresenterImpl implements IWorkflowStateListPresenter {
    private _items: IWorkflowState[] = [];
    private _meta: IGenericMeta | null = null;
    private _loading = false;
    private _error: IGenericError | null = null;
    private _type: WorkflowStateListType = "all";
    private _listParams: IWorkflowStateListPresenterListParams | undefined = undefined;

    constructor(private listWorkflowStatesUseCase: ListWorkflowStatesUseCase.Interface) {
        makeAutoObservable<WorkflowStateListPresenterImpl, "listWorkflowStatesUseCase">(this, {
            listWorkflowStatesUseCase: false
        });
    }

    get vm(): IWorkflowStateListPresenterViewModel {
        return {
            items: this._items,
            loading: this._loading,
            error: this._error,
            totalCount: this._meta?.totalCount ?? 0,
            hasMoreItems: this._meta?.hasMoreItems ?? false,
            where: this._listParams?.where ?? {},
            type: this._type
        };
    }

    list = async (params?: IWorkflowStateListPresenterListParams): Promise<void> => {
        this._listParams = {
            after: undefined,
            ...params,
            limit: 50,
            where: {
                ...params?.where,
                isActive: true
            }
        };

        await this.executeList(this._listParams);
    };

    filterBy = async (where: IWorkflowStateListPresenterListParamsWhere): Promise<void> => {
        return this.list({
            ...this._listParams,
            after: undefined,
            where
        });
    };

    nextPage = async (): Promise<void> => {
        if (!this._meta?.hasMoreItems) {
            return;
        }

        const params = {
            ...this._listParams,
            after: this._meta?.cursor ?? undefined
        };

        this._loading = true;
        this._error = null;

        try {
            const result = await this.listWorkflowStatesUseCase.execute(params, this._type);
            runInAction(() => {
                this._items = [...this._items, ...result.data];
                this._meta = result.meta;
                this._loading = false;
            });
        } catch (err) {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
                this._loading = false;
            });
        }
    };

    setType = async (type: WorkflowStateListType): Promise<void> => {
        this._type = type;
        await this.executeList(this._listParams);
    };

    private async executeList(params?: IWorkflowStateListPresenterListParams) {
        this._loading = true;
        this._error = null;

        try {
            const result = await this.listWorkflowStatesUseCase.execute(params, this._type);
            runInAction(() => {
                this._items = result.data;
                this._meta = result.meta;
                this._loading = false;
            });
        } catch (err) {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
                this._loading = false;
            });
        }
    }
}

export const WorkflowStateListPresenterImplementation = Abstraction.createImplementation({
    implementation: WorkflowStateListPresenterImpl,
    dependencies: [ListWorkflowStatesUseCase]
});
