import { IPublishItemUseCase } from "~/UseCases";
import { IPublishItemController } from "./IPublishItemController";

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
