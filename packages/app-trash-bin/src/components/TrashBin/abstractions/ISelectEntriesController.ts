import { TrashBinEntry } from "@webiny/app-trash-bin-common";

export interface ISelectEntriesController {
    execute: (entries: TrashBinEntry[]) => Promise<void>;
}
