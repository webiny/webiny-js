import { makeAutoObservable } from "mobx";
import {
    Mode,
    QueryObjectDTO,
    QueryObjectRepository
} from "~/components/AdvancedSearch/QueryObject";

export interface IQueryManagerPresenter {
    getViewModel: () => QueryManagerViewModel;
    listFilters: () => void;
    deleteFilter: (id: string) => void;
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

    async listFilters() {
        await this.repository.listFilters();
    }

    async deleteFilter(id: string) {
        await this.repository.deleteFilter(id);
    }

    selectFilter(id?: string) {
        this.repository.setSelected(id);
    }

    setMode(mode: Mode) {
        this.repository.mode = mode;
    }

    getViewModel() {
        return {
            filters: this.repository.filters,
            selected: this.repository.selected
        };
    }
}
