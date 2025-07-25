import { ICancelItemUseCase } from "~/UseCases";
import { ICancelItemController } from "./ICancelItemController";

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
