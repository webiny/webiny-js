import { Sorting, SortingDTO } from "./Sorting";

export interface ISortingRepository {
    init: (sortings: SortingDTO[]) => Promise<void>;
    sortItems: <T>(items: T[]) => T[];
    set: (sortings: SortingDTO[]) => void;
    get: () => Sorting[];
}
