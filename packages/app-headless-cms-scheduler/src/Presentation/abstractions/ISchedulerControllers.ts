import {
    ICancelItemController,
    IListItemsController,
    IListMoreItemsController,
    IPublishItemController,
    ISelectAllItemsController,
    ISelectItemsController,
    ISortItemsController,
    IUnpublishItemController,
    IUnselectAllItemsController,
    ISearchItemsController
} from "~/Presentation/Scheduler/controllers";

export interface ISchedulerControllers {
    scheduleCancelItem: ICancelItemController;
    schedulePublishItem: IPublishItemController;
    scheduleUnpublishItem: IUnpublishItemController;
    listMoreItems: IListMoreItemsController;
    listItems: IListItemsController;
    selectItems: ISelectItemsController;
    selectAllItems: ISelectAllItemsController;
    sortItems: ISortItemsController;
    unselectAllItems: IUnselectAllItemsController;
    searchItems: ISearchItemsController;
}
