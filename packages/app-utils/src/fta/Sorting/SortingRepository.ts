import { makeAutoObservable } from "mobx";
import orderBy from "lodash/orderBy";
import { Sorting, SortingDTO } from "./Sorting";
import { ISortingRepository } from "./ISortingRepository";

export class SortingRepository implements ISortingRepository {
    private sortings: Sorting[];

    constructor(sorts: SortingDTO[]) {
        this.sortings = sorts.map(sort => Sorting.create(sort));
        makeAutoObservable(this);
    }

    async init() {
        return Promise.resolve();
    }

    get() {
        return this.sortings;
    }

    set(sortings: SortingDTO[]) {
        this.sortings = this.mapDTOsToSorts(sortings);
    }

    sortItems<T>(items: T[]): T[] {
        return orderBy(
            items,
            this.sortings.map(sort => sort.field),
            this.sortings.map(sort => sort.order)
        );
    }

    private mapDTOsToSorts(sortingsDTO?: SortingDTO[]) {
        if (!sortingsDTO) {
            return [];
        }
        return sortingsDTO.map(sorting => Sorting.create(sorting));
    }
}
