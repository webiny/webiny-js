import { IListItemsController } from "./IListItemsController";
import { IListItemsUseCase } from "~/UseCases";
import type { ISchedulerListExecuteParams } from "~/Gateways/index.js";

export class ListItemsController implements IListItemsController {
    private readonly useCaseFactory: () => IListItemsUseCase;

    constructor(useCaseFactory: () => IListItemsUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(params?: Omit<ISchedulerListExecuteParams, "modelId">) {
        const listItemsUseCase = this.useCaseFactory();
        await listItemsUseCase.execute(params);
    }
}
