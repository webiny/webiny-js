import { makeAutoObservable, observable, runInAction } from "mobx";
import { IContentEntriesRepository } from "../Repository/index.js";
import type {
    IContentEntriesPresenter,
    IContentEntriesPresenterViewModel
} from "./abstractions/ContentEntriesPresenter.js";
import type { IWorkflowState } from "@webiny/app-workflows/types.js";

interface IContentEntriesPresenterParams {
    repository: IContentEntriesRepository;
}

export class ContentEntriesPresenter implements IContentEntriesPresenter {
    private readonly repository;

    private readonly states;

    public get vm(): IContentEntriesPresenterViewModel {
        return {
            loading: this.repository.loading,
            error: this.repository.error,
            states: this.states,
            items: this.repository.items,
            getFolderId: state => {
                const item = this.repository.items.find(item => {
                    return item.id === state.targetRevisionId;
                });
                return item?.wbyAco_location?.folderId;
            }
        };
    }

    public constructor(params: IContentEntriesPresenterParams) {
        this.repository = params.repository;

        this.states = observable.array<IWorkflowState>();

        makeAutoObservable(this);
    }

    addItems = async (items: IWorkflowState[]): Promise<void> => {
        runInAction(() => {
            this.states.push(...items);
        });
        if (items.length === 0) {
            return;
        }
        await this.repository.list(items.map(item => item.id));
    };
}
