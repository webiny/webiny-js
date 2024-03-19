import { TrashBinEntry } from "~/domain";

export interface ISelectEntriesController {
    execute: (entries: TrashBinEntry[]) => Promise<void>;
}
