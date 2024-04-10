import { makeAutoObservable } from "mobx";
import { ISortingRepository } from "./ISortingRepository";
import { Sorting } from "~/fta/Domain/Models";

export class SortingRepository implements ISortingRepository {
    private sorting: Sorting[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    get() {
        return this.sorting;
    }

    set(sorts: Sorting[]) {
        this.sorting = sorts;
    }
}
