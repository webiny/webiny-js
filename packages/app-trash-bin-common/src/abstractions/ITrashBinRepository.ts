import { TrashBinEntry } from "~/domain";
import { TrashBinListQueryVariables } from "~/types";

export interface ITrashBinRepository {
    init: (params?: TrashBinListQueryVariables) => Promise<void>;
    listEntries: (override: boolean, params?: TrashBinListQueryVariables) => Promise<void>;
    selectEntries: (entries: TrashBinEntry[]) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    getSelectedEntries: () => TrashBinEntry[];
    getEntries: () => TrashBinEntry[];
}
