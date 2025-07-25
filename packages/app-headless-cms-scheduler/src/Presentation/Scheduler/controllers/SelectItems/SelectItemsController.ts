import { SchedulerItem } from "~/Domain";
import { ISelectItemsUseCase } from "~/UseCases";
import { ISelectItemsController } from "./ISelectItemsController";
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
