import { makeAutoObservable, runInAction } from "mobx";
import { ISortingRepository, Sorting } from "@webiny/app-utils";

export class SortingRepositoryWithDefaults implements ISortingRepository {
    private defaults: Sorting[];
    private repository: ISortingRepository;

    constructor(defaults: Sorting[], repository: ISortingRepository) {
        this.defaults = defaults;
        this.repository = repository;
        makeAutoObservable(this);
    }

    get() {
        const existingSort = this.repository.get();

        if (existingSort.length === 0) {
            runInAction(() => {
                this.set(this.defaults);
            });
        }

        return this.repository.get();
    }

    set(sorts: Sorting[]) {
        return this.repository.set(sorts);
    }
}
