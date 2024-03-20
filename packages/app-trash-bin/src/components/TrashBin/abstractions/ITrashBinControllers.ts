import { IDeleteItemController } from "./IDeleteItemController";
import { IListMoreItemsController } from "./IListMoreItemsController";
import { ISelectItemsController } from "./ISelectItemsController";
import { ISortController } from "./ISortController";
import { ISearchController } from "~/components/TrashBin/abstractions/ISearchController";

export interface ITrashBinControllers {
    deleteItem: IDeleteItemController;
    listMoreItems: IListMoreItemsController;
    selectItems: ISelectItemsController;
    sortItems: ISortController;
    searchItem: ISearchController;
}
