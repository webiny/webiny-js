import { IUnselectAllItemsUseCase } from "~/UseCases";
import { IUnselectAllItemsController } from "./IUnselectAllItemsController";

export class UnselectAllItemsController implements IUnselectAllItemsController {
    private readonly useCaseFactory: () => IUnselectAllItemsUseCase;

    constructor(useCaseFactory: () => IUnselectAllItemsUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute() {
        const unselectAllItemsUseCase = this.useCaseFactory();
        await unselectAllItemsUseCase.execute();
    }
}
