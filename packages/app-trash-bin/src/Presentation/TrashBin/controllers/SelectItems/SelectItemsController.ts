import { TrashBinItem, TrashBinItemDTO } from "~/Domain";
import { ISelectItemsUseCase } from "~/UseCases";
import { ISelectItemsController } from "./ISelectItemsController";

export class SelectItemsController implements ISelectItemsController {
    private readonly useCaseFactory: () => ISelectItemsUseCase;

    constructor(useCaseFactory: () => ISelectItemsUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(items: TrashBinItemDTO[]) {
        const selectItemsUseCase = this.useCaseFactory();
        const itemsDTOs = items.map(item => TrashBinItem.create(item));
        await selectItemsUseCase.execute(itemsDTOs);
    }
}
