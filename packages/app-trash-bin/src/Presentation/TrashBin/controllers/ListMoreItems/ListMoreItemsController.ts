import { IListItemsUseCase, IListMoreItemsUseCase } from "~/Domain";
import { IListMoreItemsController } from "./IListMoreItemsController";

export class ListMoreItemsController implements IListMoreItemsController {
    private readonly useCaseFactory: () => IListItemsUseCase;

    constructor(useCaseFactory: () => IListMoreItemsUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute() {
        const listMoreItemsUseCase = this.useCaseFactory();
        await listMoreItemsUseCase.execute();
    }
}
