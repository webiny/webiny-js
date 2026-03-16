import type { IPublishItemUseCase } from "~/UseCases/index.js";
import type { IPublishItemController } from "./IPublishItemController.js";

export class PublishItemController implements IPublishItemController {
    private readonly useCaseFactory: () => IPublishItemUseCase;

    constructor(useCaseFactory: () => IPublishItemUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(id: string, scheduleOn: Date) {
        const cancelItemUseCase = this.useCaseFactory();
        await cancelItemUseCase.execute(id, scheduleOn);
    }
}
