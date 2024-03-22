import { IDeleteItemController } from "~/components/TrashBin/abstractions/IDeleteItemController";
import { IListMoreItemsController } from "~/components/TrashBin/abstractions/IListMoreItemsController";
import { IListItemsController } from "~/components/TrashBin/abstractions/IListItemsController";
import { ISelectItemsController } from "~/components/TrashBin/abstractions/ISelectItemsController";
import { ISortItemsController } from "~/components/TrashBin/abstractions/ISortItemsController";
import { ISearchItemsController } from "~/components/TrashBin/abstractions/ISearchItemsController";

export interface ITrashBinUseControllers {
    deleteItem: IDeleteItemController;
    listMoreItems: IListMoreItemsController;
    listItems: IListItemsController;
    selectItems: ISelectItemsController;
    sortItems: ISortItemsController;
    searchItems: ISearchItemsController;
}
