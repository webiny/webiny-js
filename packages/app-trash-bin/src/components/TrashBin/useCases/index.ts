import {
    ISearchRepository,
    ISelectedItemsRepository,
    ITrashBinItemsRepository,
    ITrashBinUseCases
} from "~/components/TrashBin/abstractions";
import { ILoadingRepository, IMetaRepository, ISortingRepository } from "@webiny/app-utils";
import { DeleteItemUseCase } from "~/components/TrashBin/useCases/DeleteItemUseCase";
import { SelectItemsUseCase } from "~/components/TrashBin/useCases/SelectItemsUseCase";
import { SortItemsUseCase } from "~/components/TrashBin/useCases/SortItemsUseCase";
import {
    ListMoreItemsUseCase,
    ListMoreItemsUseCaseWithSearch,
    ListMoreItemsUseCaseWithSorting
} from "~/components/TrashBin/useCases/ListMoreItemsUseCase";
import { SearchItemsUseCase } from "~/components/TrashBin/useCases/SearchItemsUseCase";
import {
    ListItemsUseCase,
    ListItemsUseCaseWithLoading,
    ListItemsUseCaseWithSearch,
    ListItemsUseCaseWithSorting
} from "~/components/TrashBin/useCases/ListItemsUseCase";
import { DeleteItemsUseCaseWithLoading } from "~/components/TrashBin/useCases/DeleteItemUseCase/DeleteItemUseCaseWithLoading";
import { ListMoreItemsUseCaseWithLoading } from "~/components/TrashBin/useCases/ListMoreItemsUseCase/ListMoreItemsUseCaseWithLoading";

export * from "./DeleteItemUseCase";
export * from "./ListMoreItemsUseCase";
export * from "./SearchItemsUseCase";
export * from "./SelectItemsUseCase";
export * from "./SortItemsUseCase";

export const getUseCases = (
    trashBinItemsRepository: ITrashBinItemsRepository,
    selectedItemsRepository: ISelectedItemsRepository,
    sortRepository: ISortingRepository,
    metaRepository: IMetaRepository,
    searchRepository: ISearchRepository,
    loadingRepository: ILoadingRepository
): ITrashBinUseCases => {
    const selectItemsUseCase = new SelectItemsUseCase(selectedItemsRepository);
    const sortItemsUseCase = new SortItemsUseCase(sortRepository);
    const searchItemsUseCase = new SearchItemsUseCase(searchRepository);

    const baseListItemsUseCase = new ListItemsUseCase(trashBinItemsRepository);
    const listItemsWithLoading = new ListItemsUseCaseWithLoading(
        loadingRepository,
        baseListItemsUseCase
    );
    const listItemsWithSearch = new ListItemsUseCaseWithSearch(
        searchRepository,
        listItemsWithLoading
    );
    const listItemsUseCase = new ListItemsUseCaseWithSorting(sortRepository, listItemsWithSearch);

    const baseListMoreItemsUseCase = new ListMoreItemsUseCase(
        trashBinItemsRepository,
        metaRepository
    );
    const listMoreItemsWithLoading = new ListMoreItemsUseCaseWithLoading(
        loadingRepository,
        baseListMoreItemsUseCase
    );
    const listMoreItemsWithSearch = new ListMoreItemsUseCaseWithSearch(
        searchRepository,
        listMoreItemsWithLoading
    );
    const listMoreItemsUseCase = new ListMoreItemsUseCaseWithSorting(
        sortRepository,
        listMoreItemsWithSearch
    );

    const baseDeleteItemUseCase = new DeleteItemUseCase(trashBinItemsRepository);
    const deleteItemUseCase = new DeleteItemsUseCaseWithLoading(
        loadingRepository,
        baseDeleteItemUseCase
    );

    return {
        deleteItemUseCase,
        listItemsUseCase,
        listMoreItemsUseCase,
        searchItemsUseCase,
        selectItemsUseCase,
        sortItemsUseCase
    };
};
