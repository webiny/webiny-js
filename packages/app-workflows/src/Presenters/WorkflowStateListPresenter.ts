import type {
    IWorkflowStateListPresenter,
    IWorkflowStateListPresenterListParams
} from "./abstractions/WorkflowStateListPresenter.js";
import type { IWorkflowStateListRepository } from "~/Repositories/index.js";
import { makeAutoObservable } from "mobx";

interface IWorkflowStateListPresenterParams {
    repository: IWorkflowStateListRepository;
}

export class WorkflowStateListPresenter implements IWorkflowStateListPresenter {
    private readonly repository: IWorkflowStateListRepository;

    public get vm() {
        return {
            items: this.repository.items,
            loading: this.repository.loading,
            error: this.repository.error,
            totalCount: this.repository.meta?.totalCount || 0,
            hasMoreItems: this.repository.meta?.hasMoreItems || false
        };
    }

    public constructor(params: IWorkflowStateListPresenterParams) {
        this.repository = params.repository;

        makeAutoObservable(this);
    }

    nextPage = async (): Promise<void> => {
        if (!this.repository.meta?.hasMoreItems) {
            console.warn("No more items to load.");
            return;
        }
        await this.repository.list({
            after: this.repository.meta?.cursor || undefined
        });
    };

    list = async (params?: IWorkflowStateListPresenterListParams): Promise<void> => {
        await this.repository.list(params);
    };
}
