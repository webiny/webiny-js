import type { IListMoreItemsUseCase } from "~/UseCases/index.js";
import type { IListMoreItemsController } from "./IListMoreItemsController.js";

export class ListMoreItemsController implements IListMoreItemsController {
    private readonly useCaseFactory: () => IListMoreItemsUseCase;

    constructor(useCaseFactory: () => IListMoreItemsUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute() {
        const listMoreItemsUseCase = this.useCaseFactory();
        await listMoreItemsUseCase.execute();
    }
}
