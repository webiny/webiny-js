import { ISortingRepository } from "@webiny/app-utils";
import {
    DeleteItemUseCase,
    ISearchRepository,
    ISelectedItemsRepository,
    ITrashBinItemsRepository,
    ListItemsUseCase,
    ListItemsUseCaseWithSearch,
    ListItemsUseCaseWithSorting,
    ListMoreItemsUseCase,
    RestoreItemUseCase,
    SearchItemsUseCase,
    SelectItemsUseCase,
    SortItemsUseCase
} from "~/Domain";
import {
    DeleteItemController,
    ListItemsController,
    ListMoreItemsController,
    RestoreItemController,
    SearchItemsController,
    SelectItemsController,
    SortItemsController
} from "~/Presentation/TrashBin/controllers";

export class TrashBinControllers {
    private itemsRepository: ITrashBinItemsRepository;
    private selectedRepository: ISelectedItemsRepository;
    private sortingRepository: ISortingRepository;
    private searchRepository: ISearchRepository;

    constructor(
        itemsRepository: ITrashBinItemsRepository,
        selectedRepository: ISelectedItemsRepository,
        sortingRepository: ISortingRepository,
        searchRepository: ISearchRepository
    ) {
        this.itemsRepository = itemsRepository;
        this.selectedRepository = selectedRepository;
        this.sortingRepository = sortingRepository;
        this.searchRepository = searchRepository;
    }

    getControllers() {
        // Select Items UseCase
        const selectItemsUseCase = new SelectItemsUseCase(this.selectedRepository);

        // Sort Items UseCase
        const sortItemsUseCase = new SortItemsUseCase(this.sortingRepository);

        // Search Items UseCase
        const searchItemsUseCase = new SearchItemsUseCase(this.searchRepository);

        // List Items UseCase
        const baseListItemsUseCase = new ListItemsUseCase(this.itemsRepository);
        const listItemsWithSearch = new ListItemsUseCaseWithSearch(
            this.searchRepository,
            baseListItemsUseCase
        );
        const listItemsUseCase = new ListItemsUseCaseWithSorting(
            this.sortingRepository,
            listItemsWithSearch
        );

        // List More Items UseCase
        const listMoreItemsUseCase = new ListMoreItemsUseCase(this.itemsRepository);

        // Delete Item UseCase
        const deleteItemUseCase = new DeleteItemUseCase(this.itemsRepository);

        // Restore Item UseCase
        const restoreItemUseCase = new RestoreItemUseCase(this.itemsRepository);

        // Create controllers
        const listItems = new ListItemsController(listItemsUseCase);
        const listMoreItems = new ListMoreItemsController(listMoreItemsUseCase);
        const deleteItem = new DeleteItemController(deleteItemUseCase);
        const restoreItem = new RestoreItemController(restoreItemUseCase);
        const selectItems = new SelectItemsController(selectItemsUseCase);
        const sortItems = new SortItemsController(listItemsUseCase, sortItemsUseCase);
        const searchItems = new SearchItemsController(listItemsUseCase, searchItemsUseCase);

        return {
            listItems,
            listMoreItems,
            deleteItem,
            restoreItem,
            selectItems,
            sortItems,
            searchItems
        };
    }
}
