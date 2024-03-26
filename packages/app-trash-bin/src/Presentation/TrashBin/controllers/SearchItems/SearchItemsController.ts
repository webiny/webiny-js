import { IListItemsUseCase, ISearchItemsUseCase } from "~/Domain";
import { ISearchItemsController } from "./ISearchItemsController";

export class SearchItemsController implements ISearchItemsController {
    private listItemsUseCase: IListItemsUseCase;
    private searchItemsUseCase: ISearchItemsUseCase;

    constructor(listItemsUseCase: IListItemsUseCase, searchItemsUseCase: ISearchItemsUseCase) {
        this.listItemsUseCase = listItemsUseCase;
        this.searchItemsUseCase = searchItemsUseCase;
    }

    async execute(query: string) {
        await this.searchItemsUseCase.execute(query);
        await this.listItemsUseCase.execute();
    }
}
