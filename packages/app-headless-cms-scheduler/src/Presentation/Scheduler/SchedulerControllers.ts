import type { ISortingRepository } from "@webiny/app-utils";
import type {
    ISchedulerItemsRepository,
    ISearchRepository,
    ISelectedItemsRepository
} from "~/Domain";
import type {
    ICancelItemController,
    IGetItemController,
    IListItemsController,
    IListMoreItemsController,
    IPublishItemController,
    ISearchItemsController,
    ISelectAllItemsController,
    ISelectItemsController,
    ISortItemsController,
    IUnpublishItemController,
    IUnselectAllItemsController
} from "~/Presentation/Scheduler/controllers";
import {
    CancelItemController,
    GetItemController,
    ListItemsController,
    ListMoreItemsController,
    PublishItemController,
    SearchItemsController,
    SelectAllItemsController,
    SelectItemsController,
    SortItemsController,
    UnpublishItemController,
    UnselectAllItemsController
} from "~/Presentation/Scheduler/controllers";
import {
    GetItemUseCase,
    ListItemsUseCase,
    ListItemsUseCaseWithSearch,
    ListItemsUseCaseWithSorting,
    ListMoreItemsUseCase,
    ScheduleCancelItemUseCase,
    SchedulePublishItemUseCase,
    ScheduleUnpublishItemUseCase,
    SearchItemsUseCase,
    SelectAllItemsUseCase,
    SelectItemsUseCase,
    SortItemsUseCase,
    UnselectAllItemsUseCase
} from "~/UseCases";

export interface ISchedulerControllersParams {
    itemsRepository: ISchedulerItemsRepository;
    selectedRepository: ISelectedItemsRepository;
    sortingRepository: ISortingRepository;
    searchRepository: ISearchRepository;
}

export interface ISchedulerControllersResponse {
    listItems: IListItemsController;
    getItem: IGetItemController;
    listMoreItems: IListMoreItemsController;
    selectItems: ISelectItemsController;
    selectAllItems: ISelectAllItemsController;
    unselectAllItems: IUnselectAllItemsController;
    sortItems: ISortItemsController;
    searchItems: ISearchItemsController;
    scheduleCancelItem: ICancelItemController;
    schedulePublishItem: IPublishItemController;
    scheduleUnpublishItem: IUnpublishItemController;
}

export class SchedulerControllers {
    private readonly itemsRepository: ISchedulerItemsRepository;
    private readonly selectedRepository: ISelectedItemsRepository;
    private readonly sortingRepository: ISortingRepository;
    private readonly searchRepository: ISearchRepository;

    constructor(params: ISchedulerControllersParams) {
        this.itemsRepository = params.itemsRepository;
        this.selectedRepository = params.selectedRepository;
        this.sortingRepository = params.sortingRepository;
        this.searchRepository = params.searchRepository;
    }

    public getControllers(): ISchedulerControllersResponse {
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

        const getItemUseCase = () => {
            return new GetItemUseCase(this.itemsRepository);
        };

        // List More Items UseCase
        const listMoreItemsUseCase = () => new ListMoreItemsUseCase(this.itemsRepository);

        // Delete Item UseCase
        const cancelItemUseCase = () => new ScheduleCancelItemUseCase(this.itemsRepository);
        const publishItemUseCase = () => new SchedulePublishItemUseCase(this.itemsRepository);
        const unpublishItemUseCase = () => new ScheduleUnpublishItemUseCase(this.itemsRepository);

        // Create controllers
        const listItems = new ListItemsController(listItemsUseCase);
        const getItem = new GetItemController(getItemUseCase);
        const listMoreItems = new ListMoreItemsController(listMoreItemsUseCase);
        const cancelItem = new CancelItemController(cancelItemUseCase);
        const publishItem = new PublishItemController(publishItemUseCase);
        const unpublishItem = new UnpublishItemController(unpublishItemUseCase);
        const selectItems = new SelectItemsController(selectItemsUseCase);
        const selectAllItems = new SelectAllItemsController(selectAllItemsUseCase);
        const unselectAllItems = new UnselectAllItemsController(unselectAllItemsUseCase);
        const sortItems = new SortItemsController(listItemsUseCase, sortItemsUseCase);
        const searchItems = new SearchItemsController(listItemsUseCase, searchItemsUseCase);

        return {
            listItems,
            getItem,
            listMoreItems,
            selectItems,
            selectAllItems,
            unselectAllItems,
            sortItems,
            searchItems,
            scheduleCancelItem: cancelItem,
            schedulePublishItem: publishItem,
            scheduleUnpublishItem: unpublishItem
        };
    }
}
