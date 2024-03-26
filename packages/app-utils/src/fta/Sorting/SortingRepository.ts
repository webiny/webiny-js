import { makeAutoObservable } from "mobx";
import { Sorting } from "./Sorting";
import { ISortingRepository } from "./ISortingRepository";

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
