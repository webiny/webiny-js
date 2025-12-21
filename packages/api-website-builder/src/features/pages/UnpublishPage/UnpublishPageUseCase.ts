import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import {
    UnpublishPageUseCase as UseCaseAbstraction,
    UnpublishPageRepository
} from "./abstractions.js";
import { PageBeforeUnpublishEvent, PageAfterUnpublishEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";

class UnpublishPageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: UnpublishPageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Get the page first for the before event
        const getResult = await this.getPageById.execute(params.id);

        if (getResult.isFail()) {
            return getResult;
        }

        const page = getResult.value;

        // Publish before unpublish event
        const beforeEvent = new PageBeforeUnpublishEvent({
            page
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the unpublish operation
        const result = await this.repository.execute(params);

        if (result.isFail()) {
            return result;
        }

        // Publish after unpublish event
        const afterEvent = new PageAfterUnpublishEvent({
            page: result.value
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(result.value);
    }
}

export const UnpublishPageUseCase = UseCaseAbstraction.createImplementation({
    implementation: UnpublishPageUseCaseImpl,
    dependencies: [EventPublisher, GetPageByIdUseCase, UnpublishPageRepository]
});
