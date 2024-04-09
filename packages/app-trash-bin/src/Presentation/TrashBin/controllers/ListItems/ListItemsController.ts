import { IListItemsController } from "./IListItemsController";
import { IListItemsUseCase } from "~/UseCases";

export class ListItemsController implements IListItemsController {
    private readonly useCaseFactory: () => IListItemsUseCase;

    constructor(useCaseFactory: () => IListItemsUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute() {
        const listItemsUseCase = this.useCaseFactory();
        await listItemsUseCase.execute();
    }
}
