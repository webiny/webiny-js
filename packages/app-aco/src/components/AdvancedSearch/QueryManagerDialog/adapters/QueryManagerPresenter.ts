import { makeAutoObservable } from "mobx";
import { QueryObjectDTO, QueryObjectRepository } from "~/components/AdvancedSearch/QueryObject";

export interface IQueryManagerPresenter {
    deleteFilter: (id: string) => Promise<void>;
    getViewModel: () => QueryManagerViewModel;
    load: () => Promise<void>;
}

export interface QueryManagerViewModel {
    filters: QueryObjectDTO[];
}

export class QueryManagerPresenter implements IQueryManagerPresenter {
    private repository: QueryObjectRepository;

    constructor(repository: QueryObjectRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async load() {
        await this.repository.listFilters();
    }

    async deleteFilter(id: string) {
        await this.repository.deleteFilter(id);
    }

    getViewModel() {
        return {
            filters: this.repository.filters,
            selected: this.repository.selected
        };
    }
}
