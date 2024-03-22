import { ISelectItemsController, ISelectItemsUseCase } from "~/components/TrashBin/abstractions";
import { TrashBinItem } from "@webiny/app-trash-bin-common";

export class SelectItemsController implements ISelectItemsController {
    private selectItemsUseCase: ISelectItemsUseCase;

    constructor(selectItemsUseCase: ISelectItemsUseCase) {
        this.selectItemsUseCase = selectItemsUseCase;
    }

    async execute(items: TrashBinItem[]) {
        await this.selectItemsUseCase.execute(items);
    }
}
