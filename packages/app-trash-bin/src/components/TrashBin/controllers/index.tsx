import { IMetaRepository, ISortingRepository } from "@webiny/app-utilities";
import { DeleteItemController } from "./DeleteItemController";
import { ListMoreItemsController } from "./ListMoreItemsController";
import { SelectItemsController } from "./SelectItemsController";
import { SortController } from "./SortController";
import { SortItemsController } from "./SortItemsController";
import { SortTrashBinController } from "./SortTrashBinController";
import {
    ISelectedItemsRepository,
    ITrashBinControllers,
    ITrashBinItemsRepository
} from "../abstractions";

export const useControllers = (
    trashBinItemsRepository: ITrashBinItemsRepository,
    selectedItemsRepository: ISelectedItemsRepository,
    sortRepository: ISortingRepository,
    metaRepository: IMetaRepository
): ITrashBinControllers => {
    const deleteItemController = new DeleteItemController(trashBinItemsRepository);
    const selectItemsController = new SelectItemsController(selectedItemsRepository);
    const sortItemsController = new SortItemsController(trashBinItemsRepository);
    const sortController = new SortController(sortRepository);

    const listMoreItemsController = new ListMoreItemsController(
        trashBinItemsRepository,
        metaRepository
    );

    const sortTrashBinController = new SortTrashBinController(sortController, sortItemsController);

    return {
        listMoreItems: listMoreItemsController,
        selectItems: selectItemsController,
        sortItems: sortTrashBinController,
        deleteItem: deleteItemController
    };
};
