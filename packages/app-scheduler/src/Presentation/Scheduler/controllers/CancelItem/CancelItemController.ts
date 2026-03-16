import type { ICancelItemUseCase } from "~/UseCases/index.js";
import type { ICancelItemController } from "./ICancelItemController.js";

export class CancelItemController implements ICancelItemController {
    private readonly useCaseFactory: () => ICancelItemUseCase;

    constructor(useCaseFactory: () => ICancelItemUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(id: string) {
        const cancelItemUseCase = this.useCaseFactory();
        await cancelItemUseCase.execute(id);
    }
}
