import { ISelectItemsController } from "./ISelectItemsController";
import { ISelectItemsUseCase } from "~/Domain";
import { TrashBinItem, TrashBinItemDTO } from "@webiny/app-trash-bin-common";

export class SelectItemsController implements ISelectItemsController {
    private selectItemsUseCase: ISelectItemsUseCase;

    constructor(selectItemsUseCase: ISelectItemsUseCase) {
        this.selectItemsUseCase = selectItemsUseCase;
    }

    async execute(items: TrashBinItemDTO[]) {
        const itemsDTOs = items.map(item => TrashBinItem.create(item));
        await this.selectItemsUseCase.execute(itemsDTOs);
    }
}
