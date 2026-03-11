import type { IListItemsUseCase, IListMoreItemsUseCase } from "~/UseCases/index.js";
import type { IListMoreItemsController } from "./IListMoreItemsController.js";

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
