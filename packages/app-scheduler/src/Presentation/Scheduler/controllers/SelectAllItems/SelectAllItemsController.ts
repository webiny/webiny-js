import type { ISelectAllItemsUseCase } from "~/UseCases/index.js";
import type { ISelectAllItemsController } from "./ISelectAllItemsController.js";

export class SelectAllItemsController implements ISelectAllItemsController {
    private readonly useCaseFactory: () => ISelectAllItemsUseCase;

    constructor(useCaseFactory: () => ISelectAllItemsUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute() {
        const selectAllItemsUseCase = this.useCaseFactory();
        await selectAllItemsUseCase.execute();
    }
}
