import { Sorting } from "~/fta/Domain/Models";

export interface ISortingRepository {
    set: (sorts: Sorting[]) => Promise<void>;
    get: () => Sorting[];
}
