import { TrashBinEntry } from "~/domain";

export interface ITrashBinController {
    deleteEntry: (id: string) => Promise<void>;
    listMoreEntries: () => Promise<void>;
    selectEntries: (entries: TrashBinEntry[]) => Promise<void>;
    sortEntries: () => Promise<void>;
}
