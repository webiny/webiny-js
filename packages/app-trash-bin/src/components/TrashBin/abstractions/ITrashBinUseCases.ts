import { IDeleteItemUseCase } from "./IDeleteItemUseCase";
import { IListMoreItemsUseCase } from "./IListMoreItemsUseCase";
import { ISelectItemsUseCase } from "./ISelectItemsUseCase";
import { ISortItemsUseCase } from "./ISortItemsUseCase";
import { ISearchItemsUseCase } from "./ISearchItemsUseCase";

export interface ITrashBinUseCases {
    deleteItemUseCase: IDeleteItemUseCase;
    listMoreItemsUseCase: IListMoreItemsUseCase;
    selectItemsUseCase: ISelectItemsUseCase;
    sortItemsUseCase: ISortItemsUseCase;
    searchItemsUseCase: ISearchItemsUseCase;
}
