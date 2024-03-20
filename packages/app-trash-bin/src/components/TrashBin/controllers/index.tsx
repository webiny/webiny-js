import {
    IMetaRepository,
    ISortRepository,
    ITrashBinRepository
} from "@webiny/app-trash-bin-common";
import { DeleteItemController } from "./DeleteItemController";
import { ListMoreItemsController } from "./ListMoreItemsController";
import { SelectItemsController } from "./SelectItemsController";
import { SortController } from "./SortController";
import { SortItemsController } from "./SortItemsController";
import { SortTrashBinController } from "./SortTrashBinController";
import { ITrashBinControllers } from "../abstractions";

export const useControllers = (
    trashBinRepository: ITrashBinRepository,
    sortRepository: ISortRepository,
    metaRepository: IMetaRepository
): ITrashBinControllers => {
    const deleteItemController = new DeleteItemController(trashBinRepository);
    const selectItemsController = new SelectItemsController(trashBinRepository);
    const sortItemsController = new SortItemsController(trashBinRepository);
    const sortController = new SortController(sortRepository);

    const listMoreItemsController = new ListMoreItemsController(trashBinRepository, metaRepository);

    const sortTrashBinController = new SortTrashBinController(sortController, sortItemsController);

    return {
        listMoreItems: listMoreItemsController,
        selectItems: selectItemsController,
        sortItems: sortTrashBinController,
        deleteItem: deleteItemController
    };
};
