import { Sorting } from "./Sorting";

export interface ISortingRepository {
    set: (sorts: Sorting[]) => void;
    get: () => Sorting[];
}
