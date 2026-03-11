import { makeAutoObservable, runInAction } from "mobx";
import type { ISortingRepository, Sorting } from "@webiny/app-utils";

export class SortingRepositoryWithDefaults implements ISortingRepository {
    private readonly defaults: Sorting[];
    private readonly repository: ISortingRepository;

    public constructor(defaults: Sorting[], repository: ISortingRepository) {
        this.defaults = defaults;
        this.repository = repository;
        makeAutoObservable(this);
    }

    public get() {
        const existingSort = this.repository.get();

        if (existingSort.length === 0) {
            runInAction(() => {
                this.set(this.defaults);
            });
        }

        return this.repository.get();
    }

    public set(sorts: Sorting[]) {
        return this.repository.set(sorts);
    }
}
