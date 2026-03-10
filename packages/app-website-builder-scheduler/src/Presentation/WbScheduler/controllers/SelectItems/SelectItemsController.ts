import { WbSchedulerItem } from "~/Domain/index.js";
import type { ISelectItemsUseCase } from "~/UseCases/index.js";
import type { ISelectItemsController } from "./ISelectItemsController.js";
import type { WbSchedulerEntry } from "~/types.js";

export class SelectItemsController implements ISelectItemsController {
    private readonly useCaseFactory: () => ISelectItemsUseCase;

    constructor(useCaseFactory: () => ISelectItemsUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(items: WbSchedulerEntry[]) {
        const selectItemsUseCase = this.useCaseFactory();
        const itemsDTOs = items.map(item => WbSchedulerItem.create(item));
        await selectItemsUseCase.execute(itemsDTOs);
    }
}
