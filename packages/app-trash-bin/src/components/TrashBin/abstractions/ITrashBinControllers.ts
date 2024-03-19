import { IDeleteEntryController } from "./IDeleteEntryController";
import { IListMoreEntriesController } from "./IListMoreEntriesController";
import { ISelectEntriesController } from "./ISelectEntriesController";
import { ISortController } from "./ISortController";

export interface ITrashBinControllers {
    deleteEntry: IDeleteEntryController;
    listMoreEntries: IListMoreEntriesController;
    selectEntries: ISelectEntriesController;
    sortEntries: ISortController;
}
