import { Result, createImplementation } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { PublishPageUseCase as UseCaseAbstraction, PublishPageRepository } from "./abstractions.js";
import { PageBeforePublishEvent, PageAfterPublishEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";

class PublishPageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: PublishPageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Get the page first for the before event
        const getResult = await this.getPageById.execute(params.id);

        if (getResult.isFail()) {
            return getResult;
        }

        const page = getResult.value;

        // Publish before publish event
        const beforeEvent = new PageBeforePublishEvent({
            page
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the publish operation
        const result = await this.repository.execute(params);

        if (result.isFail()) {
            return result;
        }

        // Publish after publish event
        const afterEvent = new PageAfterPublishEvent({
            page: result.value
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(result.value);
    }
}

export const PublishPageUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: PublishPageUseCaseImpl,
    dependencies: [EventPublisher, GetPageByIdUseCase, PublishPageRepository]
});
