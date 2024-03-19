import { ISortRepository, ITrashBinRepository } from "@webiny/app-trash-bin-common";
import { DeleteEntryController } from "./DeleteEntryController";
import { ListMoreEntriesController } from "./ListMoreEntriesController";
import { SelectEntriesController } from "./SelectEntriesController";
import { SortController } from "./SortController";
import { SortEntriesController } from "./SortEntriesController";
import { SortTrashBinController } from "./SortTrashBinController";
import { ITrashBinControllers } from "../abstractions";

export const useControllers = (
    trashBinRepository: ITrashBinRepository,
    sortRepository: ISortRepository
): ITrashBinControllers => {
    // Trash Bin controllers
    const deleteEntryController = new DeleteEntryController(trashBinRepository);
    const listMoreEntriesController = new ListMoreEntriesController(trashBinRepository);
    const selectEntriesController = new SelectEntriesController(trashBinRepository);
    const sortEntriesController = new SortEntriesController(trashBinRepository);

    // Sort controllers
    const sortController = new SortController(sortRepository);
    const sortTrashBinController = new SortTrashBinController(
        sortController,
        sortEntriesController
    );

    return {
        listMoreEntries: listMoreEntriesController,
        selectEntries: selectEntriesController,
        sortEntries: sortTrashBinController,
        deleteEntry: deleteEntryController
    };
};
