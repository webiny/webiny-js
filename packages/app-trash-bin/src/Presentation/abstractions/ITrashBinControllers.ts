import {
    IBulkActionsController,
    IDeleteItemController,
    IGetRestoredItemByIdController,
    IListItemsController,
    IListMoreItemsController,
    IRestoreItemController,
    ISearchItemsController,
    ISelectAllItemsController,
    ISelectItemsController,
    ISortItemsController,
    IUnselectAllItemsController
} from "~/Presentation/TrashBin/controllers";

export interface ITrashBinControllers {
    deleteItem: IDeleteItemController;
    getRestoredItemById: IGetRestoredItemByIdController;
    restoreItem: IRestoreItemController;
    listMoreItems: IListMoreItemsController;
    listItems: IListItemsController;
    selectItems: ISelectItemsController;
    selectAllItems: ISelectAllItemsController;
    sortItems: ISortItemsController;
    searchItems: ISearchItemsController;
    unselectAllItems: IUnselectAllItemsController;
    restoreBulkAction: IBulkActionsController;
    deleteBulkAction: IBulkActionsController;
}
