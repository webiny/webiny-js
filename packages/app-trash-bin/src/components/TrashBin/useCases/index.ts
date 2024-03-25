import {
    ISearchRepository,
    ISelectedItemsRepository,
    ITrashBinItemsRepository,
    ITrashBinUseCases
} from "~/components/TrashBin/abstractions";
import { ISortingRepository } from "@webiny/app-utils";
import { DeleteItemUseCase } from "~/components/TrashBin/useCases/DeleteItemUseCase";
import { SelectItemsUseCase } from "~/components/TrashBin/useCases/SelectItemsUseCase";
import { SortItemsUseCase } from "~/components/TrashBin/useCases/SortItemsUseCase";
import { ListMoreItemsUseCase } from "~/components/TrashBin/useCases/ListMoreItemsUseCase";
import { SearchItemsUseCase } from "~/components/TrashBin/useCases/SearchItemsUseCase";
import {
    ListItemsUseCase,
    ListItemsUseCaseWithSearch,
    ListItemsUseCaseWithSorting
} from "~/components/TrashBin/useCases/ListItemsUseCase";

export * from "./DeleteItemUseCase";
export * from "./ListMoreItemsUseCase";
export * from "./SearchItemsUseCase";
export * from "./SelectItemsUseCase";
export * from "./SortItemsUseCase";

export const getUseCases = (
    trashBinItemsRepository: ITrashBinItemsRepository,
    selectedItemsRepository: ISelectedItemsRepository,
    sortRepository: ISortingRepository,
    searchRepository: ISearchRepository
): ITrashBinUseCases => {
    const selectItemsUseCase = new SelectItemsUseCase(selectedItemsRepository);
    const sortItemsUseCase = new SortItemsUseCase(sortRepository);
    const searchItemsUseCase = new SearchItemsUseCase(searchRepository);

    const baseListItemsUseCase = new ListItemsUseCase(trashBinItemsRepository);
    const listItemsWithSearch = new ListItemsUseCaseWithSearch(
        searchRepository,
        baseListItemsUseCase
    );
    const listItemsUseCase = new ListItemsUseCaseWithSorting(sortRepository, listItemsWithSearch);

    const listMoreItemsUseCase = new ListMoreItemsUseCase(trashBinItemsRepository);

    const deleteItemUseCase = new DeleteItemUseCase(trashBinItemsRepository);

    return {
        deleteItemUseCase,
        listItemsUseCase,
        listMoreItemsUseCase,
        searchItemsUseCase,
        selectItemsUseCase,
        sortItemsUseCase
    };
};
