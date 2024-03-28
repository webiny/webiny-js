import {
    IDeleteItemController,
    IListItemsController,
    IListMoreItemsController,
    ISearchItemsController,
    ISelectItemsController,
    ISortItemsController
} from "~/Presentation/TrashBin/controllers";

export interface ITrashBinControllers {
    deleteItem: IDeleteItemController;
    listMoreItems: IListMoreItemsController;
    listItems: IListItemsController;
    selectItems: ISelectItemsController;
    sortItems: ISortItemsController;
    searchItems: ISearchItemsController;
}
