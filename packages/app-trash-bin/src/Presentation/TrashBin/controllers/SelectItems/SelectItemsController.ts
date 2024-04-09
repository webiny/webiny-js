import { ISelectItemsController } from "./ISelectItemsController";
import { ISelectItemsUseCase } from "~/UseCases";
import { TrashBinItem, TrashBinItemDTO } from "@webiny/app-trash-bin-common";

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
