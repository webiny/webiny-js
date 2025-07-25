import { IListItemsUseCase, ISearchItemsUseCase } from "~/UseCases";
import { ISearchItemsController } from "./ISearchItemsController";

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
