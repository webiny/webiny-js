import { Sort, SortDTO } from "~/domain";

export interface ISortRepository {
    sortItems: <T>(items: T[]) => T[];
    set: (sorts: SortDTO[]) => void;
    get: () => Sort[];
}
