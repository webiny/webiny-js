import type { IGetItemController } from "./IGetItemController.js";
import type { IGetItemUseCase } from "~/UseCases/index.js";
import type { IWbSchedulerGetExecuteParams } from "~/Gateways/index.js";

export class GetItemController implements IGetItemController {
    private readonly useCaseFactory: () => IGetItemUseCase;

    constructor(useCaseFactory: () => IGetItemUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(params: Omit<IWbSchedulerGetExecuteParams, "modelId">) {
        const getItemUseCase = this.useCaseFactory();
        await getItemUseCase.execute(params);
    }
}
