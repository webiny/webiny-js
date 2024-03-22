import {
    ISearchRepository,
    ISelectedItemsRepository,
    ITrashBinItemsRepository,
    ITrashBinUseCases
} from "~/components/TrashBin/abstractions";
import { IMetaRepository, ISortingRepository } from "@webiny/app-utils";
import { DeleteItemUseCase } from "~/components/TrashBin/useCases/DeleteItemUseCase";
import { SelectItemsUseCase } from "~/components/TrashBin/useCases/SelectItemsUseCase";
import { SortItemsUseCase } from "~/components/TrashBin/useCases/SortItemsUseCase";
import { ListMoreItemsUseCase } from "~/components/TrashBin/useCases/ListMoreItemsUseCase";
import { SearchItemsUseCase } from "~/components/TrashBin/useCases/SearchItemsUseCase";

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
    searchRepository: ISearchRepository
): ITrashBinUseCases => {
    const deleteItemUseCase = new DeleteItemUseCase(trashBinItemsRepository);
    const selectItemsUseCase = new SelectItemsUseCase(selectedItemsRepository);
    const sortItemsUseCase = new SortItemsUseCase(trashBinItemsRepository, sortRepository);
    const listMoreItemsUseCase = new ListMoreItemsUseCase(trashBinItemsRepository, metaRepository);
    const searchItemsUseCase = new SearchItemsUseCase(trashBinItemsRepository, searchRepository);

    return {
        deleteItemUseCase,
        listMoreItemsUseCase,
        searchItemsUseCase,
        selectItemsUseCase,
        sortItemsUseCase
    };
};
