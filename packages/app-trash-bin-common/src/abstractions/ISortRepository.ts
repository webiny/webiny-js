import { Sort } from "~/domain";

export interface ISortRepository {
    init: () => Promise<void>;
    sortEntries: <T>(entries: T[]) => T[];
    set: (sorts: Sort[]) => void;
    get: () => Sort[];
}
