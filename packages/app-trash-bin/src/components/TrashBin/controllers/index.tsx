import {
    IMetaRepository,
    ISortRepository,
    ITrashBinRepository
} from "@webiny/app-trash-bin-common";
import { DeleteEntryController } from "./DeleteEntryController";
import { ListMoreEntriesController } from "./ListMoreEntriesController";
import { SelectEntriesController } from "./SelectEntriesController";
import { SortController } from "./SortController";
import { SortEntriesController } from "./SortEntriesController";
import { SortTrashBinController } from "./SortTrashBinController";
import { ITrashBinControllers } from "../abstractions";

export const useControllers = (
    trashBinRepository: ITrashBinRepository,
    sortRepository: ISortRepository,
    metaRepository: IMetaRepository
): ITrashBinControllers => {
    const deleteEntryController = new DeleteEntryController(trashBinRepository);
    const selectEntriesController = new SelectEntriesController(trashBinRepository);
    const sortEntriesController = new SortEntriesController(trashBinRepository);
    const sortController = new SortController(sortRepository);

    const listMoreEntriesController = new ListMoreEntriesController(
        trashBinRepository,
        metaRepository
    );

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
