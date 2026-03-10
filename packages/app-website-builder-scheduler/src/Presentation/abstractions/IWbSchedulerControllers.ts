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
} from "~/Presentation/WbScheduler/controllers/index.js";

export interface IWbSchedulerControllers {
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
