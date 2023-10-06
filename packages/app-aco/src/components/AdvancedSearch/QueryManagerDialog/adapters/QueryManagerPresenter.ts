import { makeAutoObservable } from "mobx";
import { QueryObjectDTO, QueryObjectRepository } from "~/components/AdvancedSearch/QueryObject";

export interface IQueryManagerPresenter {
    deleteFilter: (id: string) => Promise<void>;
    listFilters: () => Promise<void>;
    updateViewModel: () => void;
    load: (callback: (viewModel: QueryManagerViewModel) => void) => void;
}

export interface QueryManagerViewModel {
    filters: QueryObjectDTO[];
}

export class QueryManagerPresenter implements IQueryManagerPresenter {
    private repository: QueryObjectRepository;
    private callback: ((viewModel: QueryManagerViewModel) => void) | undefined = undefined;
    viewModel: QueryManagerViewModel | undefined;

    constructor(repository: QueryObjectRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    load(callback: (viewModel: QueryManagerViewModel) => void) {
        this.callback = callback;
        this.updateViewModel();
    }

    getViewModel() {
        return {
            filters: this.repository.filters
        };
    }

    async listFilters() {
        await this.repository.listFilters();
        this.updateViewModel();
    }

    async deleteFilter(id: string) {
        await this.repository.deleteFilter(id);
        this.updateViewModel();
    }

    updateViewModel() {
        this.viewModel = {
            filters: this.repository.filters
        };
        this.callback && this.callback(this.viewModel);
    }
}
