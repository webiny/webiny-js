import { makeAutoObservable } from "mobx";
import orderBy from "lodash/orderBy";
import { ISortRepository } from "~/abstractions";
import { Sort } from "./Sort";

export class SortRepository implements ISortRepository {
    private sorts: Sort[];

    constructor(sorts: Sort[]) {
        this.sorts = sorts;
        makeAutoObservable(this);
    }

    init() {
        return Promise.resolve();
    }

    set(sorts: Sort[]) {
        this.sorts = sorts;
    }

    get() {
        return this.sorts;
    }

    sortEntries<T>(entries: T[]): T[] {
        return orderBy(
            entries,
            this.sorts.map(sort => sort.field),
            this.sorts.map(sort => sort.order)
        );
    }
}
