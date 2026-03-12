import type { IListItemsController } from "./IListItemsController.js";
import type { IListItemsUseCase } from "~/UseCases/index.js";
import type { IListScheduleActionsGatewayExecuteParams } from "~/Gateways/index.js";

export class ListItemsController implements IListItemsController {
    private readonly useCaseFactory: () => IListItemsUseCase;

    constructor(useCaseFactory: () => IListItemsUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(params?: Omit<IListScheduleActionsGatewayExecuteParams, "namespace">) {
        const listItemsUseCase = this.useCaseFactory();
        await listItemsUseCase.execute(params);
    }
}
