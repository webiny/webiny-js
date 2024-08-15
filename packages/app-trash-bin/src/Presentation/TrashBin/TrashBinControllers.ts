import { ISortingRepository } from "@webiny/app-utils";
import { ISearchRepository, ISelectedItemsRepository, ITrashBinItemsRepository } from "~/Domain";
import {
    BulkActionsController,
    DeleteItemController,
    GetRestoredItemByIdController,
    ListItemsController,
    ListMoreItemsController,
    RestoreItemController,
    SearchItemsController,
    SelectAllItemsController,
    SelectItemsController,
    SortItemsController,
    UnselectAllItemsController
} from "~/Presentation/TrashBin/controllers";
import {
    BulkActionUseCase,
    DeleteItemUseCase,
    GetRestoredItemUseCase,
    ListItemsUseCase,
    ListItemsUseCaseWithSearch,
    ListItemsUseCaseWithSorting,
    ListMoreItemsUseCase,
    RestoreItemUseCase,
    SearchItemsUseCase,
    SelectAllItemsUseCase,
    SelectItemsUseCase,
    SortItemsUseCase,
    UnselectAllItemsUseCase
} from "~/UseCases";

export class TrashBinControllers {
    private readonly itemsRepository: ITrashBinItemsRepository;
    private readonly selectedRepository: ISelectedItemsRepository;
    private readonly sortingRepository: ISortingRepository;
    private readonly searchRepository: ISearchRepository;
    private readonly deleteBulkActionName: string;
    private readonly restoreBulkActionName: string;

    constructor(
        itemsRepository: ITrashBinItemsRepository,
        selectedRepository: ISelectedItemsRepository,
        sortingRepository: ISortingRepository,
        searchRepository: ISearchRepository,
        deleteBulkActionName: string,
        restoreBulkActionName: string
    ) {
        this.itemsRepository = itemsRepository;
        this.selectedRepository = selectedRepository;
        this.sortingRepository = sortingRepository;
        this.searchRepository = searchRepository;
        this.deleteBulkActionName = deleteBulkActionName;
        this.restoreBulkActionName = restoreBulkActionName;
    }

    getControllers() {
        // Select Items UseCase
        const selectItemsUseCase = () => new SelectItemsUseCase(this.selectedRepository);

        // Select All Items UseCase
        const selectAllItemsUseCase = () => new SelectAllItemsUseCase(this.selectedRepository);

        // Unselect All Items UseCase
        const unselectAllItemsUseCase = () => new UnselectAllItemsUseCase(this.selectedRepository);

        // Sort Items UseCase
        const sortItemsUseCase = () => new SortItemsUseCase(this.sortingRepository);

        // Search Items UseCase
        const searchItemsUseCase = () => new SearchItemsUseCase(this.searchRepository);

        // List Items UseCase
        const listItemsUseCase = () => {
            const baseListItemsUseCase = new ListItemsUseCase(this.itemsRepository);
            const listItemsWithSearch = new ListItemsUseCaseWithSearch(
                this.searchRepository,
                baseListItemsUseCase
            );
            return new ListItemsUseCaseWithSorting(this.sortingRepository, listItemsWithSearch);
        };

        // List More Items UseCase
        const listMoreItemsUseCase = () => new ListMoreItemsUseCase(this.itemsRepository);

        // Delete Item UseCase
        const deleteItemUseCase = () => new DeleteItemUseCase(this.itemsRepository);

        // Restore Item UseCase
        const restoreItemUseCase = () => new RestoreItemUseCase(this.itemsRepository);

        // Get RestoredItem UseCase
        const getRestoredItemUseCase = () => new GetRestoredItemUseCase(this.itemsRepository);

        // Bulk Action UseCase
        const bulkActionUseCase = () => new BulkActionUseCase(this.itemsRepository);

        // Create controllers
        const listItems = new ListItemsController(listItemsUseCase);
        const listMoreItems = new ListMoreItemsController(listMoreItemsUseCase);
        const deleteItem = new DeleteItemController(deleteItemUseCase);
        const restoreItem = new RestoreItemController(restoreItemUseCase);
        const selectItems = new SelectItemsController(selectItemsUseCase);
        const selectAllItems = new SelectAllItemsController(selectAllItemsUseCase);
        const unselectAllItems = new UnselectAllItemsController(unselectAllItemsUseCase);
        const sortItems = new SortItemsController(listItemsUseCase, sortItemsUseCase);
        const searchItems = new SearchItemsController(listItemsUseCase, searchItemsUseCase);
        const getRestoredItemById = new GetRestoredItemByIdController(getRestoredItemUseCase);
        const restoreBulkAction = new BulkActionsController(
            bulkActionUseCase,
            this.restoreBulkActionName
        );
        const deleteBulkAction = new BulkActionsController(
            bulkActionUseCase,
            this.deleteBulkActionName
        );

        return {
            listItems,
            listMoreItems,
            deleteItem,
            restoreItem,
            restoreBulkAction,
            deleteBulkAction,
            selectItems,
            selectAllItems,
            unselectAllItems,
            sortItems,
            searchItems,
            getRestoredItemById
        };
    }
}
