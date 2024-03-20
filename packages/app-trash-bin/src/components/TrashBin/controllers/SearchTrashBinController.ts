import { makeAutoObservable } from "mobx";
import { ISearchController, ISearchItemsController } from "../abstractions";

export class SearchTrashBinController implements ISearchController {
    private searchItemsController: ISearchItemsController;
    private searchController: ISearchController;

    constructor(
        searchItemsController: ISearchItemsController,
        searchController: ISearchController
    ) {
        this.searchItemsController = searchItemsController;
        this.searchController = searchController;
        makeAutoObservable(this);
    }

    async execute(query: string) {
        await this.searchController.execute(query);
        await this.searchItemsController.execute({ search: query || undefined });
    }
}
