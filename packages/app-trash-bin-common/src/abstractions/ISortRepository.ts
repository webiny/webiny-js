import { Sort, SortDTO } from "~/domain";

export interface ISortRepository {
    sortEntries: <T>(entries: T[]) => T[];
    set: (sorts: SortDTO[]) => void;
    get: () => Sort[];
}
