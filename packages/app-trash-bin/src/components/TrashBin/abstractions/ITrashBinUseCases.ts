import { IDeleteItemUseCase } from "./IDeleteItemUseCase";
import { ISelectItemsUseCase } from "./ISelectItemsUseCase";
import { ISortItemsUseCase } from "./ISortItemsUseCase";
import { ISearchItemsUseCase } from "./ISearchItemsUseCase";
import { IListItemsUseCase } from "./IListItemsUseCase";
import { IListMoreItemsUseCase } from "~/components/TrashBin/abstractions/IListMoreItemsUseCase";

export interface ITrashBinUseCases {
    deleteItemUseCase: IDeleteItemUseCase;
    listItemsUseCase: IListItemsUseCase;
    listMoreItemsUseCase: IListMoreItemsUseCase;
    selectItemsUseCase: ISelectItemsUseCase;
    sortItemsUseCase: ISortItemsUseCase;
    searchItemsUseCase: ISearchItemsUseCase;
}
