import type { IGetItemController } from "./IGetItemController.js";
import type { IGetItemUseCase } from "~/UseCases/index.js";
import type { IGetScheduledActionGatewayExecuteParams } from "~/Gateways/index.js";

export class GetItemController implements IGetItemController {
    private readonly useCaseFactory: () => IGetItemUseCase;

    constructor(useCaseFactory: () => IGetItemUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(params: Omit<IGetScheduledActionGatewayExecuteParams, "namespace">) {
        const getItemUseCase = this.useCaseFactory();
        await getItemUseCase.execute(params);
    }
}
