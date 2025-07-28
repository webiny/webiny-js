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

export interface ISchedulerControllers {
    scheduleCancelItem: ICancelItemController;
    schedulePublishItem: IPublishItemController;
    scheduleUnpublishItem: IUnpublishItemController;
    listMoreItems: IListMoreItemsController;
    getItem: IGetItemController;
    listItems: IListItemsController;
    selectItems: ISelectItemsController;
    selectAllItems: ISelectAllItemsController;
    sortItems: ISortItemsController;
    unselectAllItems: IUnselectAllItemsController;
    searchItems: ISearchItemsController;
}
