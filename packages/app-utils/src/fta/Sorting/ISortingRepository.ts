import { Sorting, SortingDTO } from "./Sorting";

export interface ISortingRepository {
    init: () => Promise<void>;
    sortItems: <T>(items: T[]) => T[];
    set: (sortings: SortingDTO[]) => void;
    get: () => Sorting[];
}
