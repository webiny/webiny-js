import {
    IDeleteItemController,
    IListItemsController,
    IListMoreItemsController,
    IRestoreItemController,
    ISearchItemsController,
    ISelectItemsController,
    ISortItemsController
} from "~/Presentation/TrashBin/controllers";

export interface ITrashBinControllers {
    deleteItem: IDeleteItemController;
    restoreItem: IRestoreItemController;
    listMoreItems: IListMoreItemsController;
    listItems: IListItemsController;
    selectItems: ISelectItemsController;
    sortItems: ISortItemsController;
    searchItems: ISearchItemsController;
}
