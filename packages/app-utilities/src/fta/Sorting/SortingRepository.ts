import { makeAutoObservable } from "mobx";
import orderBy from "lodash/orderBy";
import { Sorting, SortingDTO } from "./Sorting";
import { ISortingRepository } from "./ISortingRepository";

export class SortingRepository implements ISortingRepository {
    private sortings: Sorting[];

    constructor() {
        this.sortings = [];
        makeAutoObservable(this);
    }

    async init(sortings?: SortingDTO[]) {
        this.sortings = this.mapDTOsToSorts(sortings);
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
