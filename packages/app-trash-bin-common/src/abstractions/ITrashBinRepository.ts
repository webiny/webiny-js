import { Sort, TrashBinEntry } from "~/domain";
import { TrashBinListQueryVariables, TrashBinMetaResponse } from "~/types";

export interface ITrashBinRepository {
    init: () => Promise<void>;
    getSelectedEntries: () => TrashBinEntry[];
    getEntries: () => TrashBinEntry[];
    getMeta: () => TrashBinMetaResponse;
    getSort: () => Sort[];
    getLoading: () => boolean;
    listEntries: (override: boolean, params?: TrashBinListQueryVariables) => Promise<void>;
    selectEntries: (entries: TrashBinEntry[]) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
}
