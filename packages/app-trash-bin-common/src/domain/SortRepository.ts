import { makeAutoObservable } from "mobx";
import orderBy from "lodash/orderBy";
import { ISortRepository } from "~/abstractions";
import { Sort, SortDTO } from "./Sort";

export class SortRepository implements ISortRepository {
    private sorts: Sort[];

    constructor() {
        this.sorts = [];
        makeAutoObservable(this);
    }

    async init(sorts?: SortDTO[]) {
        this.sorts = this.mapSortsDTOToSorts(sorts);
    }

    get() {
        return this.sorts;
    }

    set(sorts: SortDTO[]) {
        this.sorts = this.mapSortsDTOToSorts(sorts);
    }

    sortItems<T>(items: T[]): T[] {
        return orderBy(
            items,
            this.sorts.map(sort => sort.field),
            this.sorts.map(sort => sort.order)
        );
    }

    private mapSortsDTOToSorts(sortsDTO?: SortDTO[]) {
        if (!sortsDTO) {
            return [];
        }
        return sortsDTO.map(sort => Sort.create(sort));
    }
}
