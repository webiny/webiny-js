import { SchedulerItem } from "~/Domain/index.js";
import type { ISelectItemsUseCase } from "~/UseCases/index.js";
import type { ISelectItemsController } from "./ISelectItemsController.js";
import type { SchedulerEntry } from "~/types.js";

export class SelectItemsController implements ISelectItemsController {
    private readonly useCaseFactory: () => ISelectItemsUseCase;

    constructor(useCaseFactory: () => ISelectItemsUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(items: SchedulerEntry[]) {
        const selectItemsUseCase = this.useCaseFactory();
        const itemsDTOs = items.map(item => SchedulerItem.create(item));
        await selectItemsUseCase.execute(itemsDTOs);
    }
}
