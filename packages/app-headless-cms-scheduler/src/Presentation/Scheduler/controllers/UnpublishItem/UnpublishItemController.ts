import { IUnpublishItemUseCase } from "~/UseCases";
import { IUnpublishItemController } from "./IUnpublishItemController";

export class UnpublishItemController implements IUnpublishItemController {
    private readonly useCaseFactory: () => IUnpublishItemUseCase;

    constructor(useCaseFactory: () => IUnpublishItemUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(id: string, scheduleOn: Date) {
        const cancelItemUseCase = this.useCaseFactory();
        await cancelItemUseCase.execute(id, scheduleOn);
    }
}
