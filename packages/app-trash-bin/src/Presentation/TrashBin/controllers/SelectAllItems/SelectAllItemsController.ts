import { ISelectAllItemsUseCase } from "~/UseCases";
import { ISelectAllItemsController } from "./ISelectAllItemsController";

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
