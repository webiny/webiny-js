import { IMetaRepository, ISortingRepository } from "@webiny/app-utilities";
import { DeleteItemController } from "./DeleteItemController";
import { ListMoreItemsController } from "./ListMoreItemsController";
import { SelectItemsController } from "./SelectItemsController";
import { SortController } from "./SortController";
import { SortItemsController } from "./SortItemsController";
import { SortTrashBinController } from "./SortTrashBinController";
import {
    ISearchRepository,
    ISelectedItemsRepository,
    ITrashBinControllers,
    ITrashBinItemsRepository
} from "../abstractions";
import { DeleteItemControllerWithMeta } from "~/components/TrashBin/controllers/DeleteItemControllerWithMeta";
import { SearchController } from "~/components/TrashBin/controllers/SearchController";
import { SearchItemsController } from "~/components/TrashBin/controllers/SearchItemsController";
import { SearchTrashBinController } from "~/components/TrashBin/controllers/SearchTrashBinController";

export const useControllers = (
    trashBinItemsRepository: ITrashBinItemsRepository,
    selectedItemsRepository: ISelectedItemsRepository,
    sortRepository: ISortingRepository,
    metaRepository: IMetaRepository,
    searchRepository: ISearchRepository
): ITrashBinControllers => {
    const deleteItemController = new DeleteItemController(trashBinItemsRepository);
    const selectItemsController = new SelectItemsController(selectedItemsRepository);
    const sortItemsController = new SortItemsController(trashBinItemsRepository);
    const sortController = new SortController(sortRepository);
    const searchController = new SearchController(searchRepository);
    const searchItemsController = new SearchItemsController(trashBinItemsRepository);

    const listMoreItemsController = new ListMoreItemsController(
        trashBinItemsRepository,
        metaRepository
    );

    const sortTrashBinController = new SortTrashBinController(sortController, sortItemsController);
    const searchTrashBinController = new SearchTrashBinController(
        searchItemsController,
        searchController
    );

    const deleteItemControllerWithMeta = new DeleteItemControllerWithMeta(
        metaRepository,
        deleteItemController
    );

    return {
        listMoreItems: listMoreItemsController,
        selectItems: selectItemsController,
        sortItems: sortTrashBinController,
        deleteItem: deleteItemControllerWithMeta,
        searchItem: searchTrashBinController
    };
};
