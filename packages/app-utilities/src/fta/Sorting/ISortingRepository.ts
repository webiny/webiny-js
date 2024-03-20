import { Sorting, SortingDTO } from "./Sorting";

export interface ISortingRepository {
    sortItems: <T>(items: T[]) => T[];
    set: (sortings: SortingDTO[]) => void;
    get: () => Sorting[];
}
