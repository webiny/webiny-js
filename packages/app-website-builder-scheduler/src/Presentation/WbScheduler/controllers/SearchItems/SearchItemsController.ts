import type { IListItemsUseCase, ISearchItemsUseCase } from "~/UseCases/index.js";
import type { ISearchItemsController } from "./ISearchItemsController.js";

export class SearchItemsController implements ISearchItemsController {
    private readonly listItemsUseCaseFactory: () => IListItemsUseCase;
    private readonly searchItemsUseCaseFactory: () => ISearchItemsUseCase;

    constructor(
        listItemsUseCaseFactory: () => IListItemsUseCase,
        searchItemsUseCaseFactory: () => ISearchItemsUseCase
    ) {
        this.listItemsUseCaseFactory = listItemsUseCaseFactory;
        this.searchItemsUseCaseFactory = searchItemsUseCaseFactory;
    }

    async execute(value: string) {
        const searchItemsUseCase = this.searchItemsUseCaseFactory();
        const listItemsUseCase = this.listItemsUseCaseFactory();

        await searchItemsUseCase.execute(value);
        await listItemsUseCase.execute();
    }
}
