import { Result, createImplementation } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { CreatePageUseCase as UseCaseAbstraction, CreatePageRepository } from "./abstractions.js";
import { PageBeforeCreateEvent, PageAfterCreateEvent } from "./events.js";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { CreateWbPageData } from "~/context/pages/pages.types.js";

class CreatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private repository: CreatePageRepository.Interface
    ) {}

    async execute(data: CreateWbPageData): Promise<Result<WbPage, UseCaseAbstraction.Error>> {
        // Publish before create event
        const beforeCreateEvent = new PageBeforeCreateEvent({ input: data });

        await this.eventPublisher.publish(beforeCreateEvent);

        // Execute the create operation
        const result = await this.repository.execute(data);

        if (result.isFail()) {
            return result;
        }

        const page = result.value;

        // Publish after create event
        const afterCreateEvent = new PageAfterCreateEvent({ page });

        await this.eventPublisher.publish(afterCreateEvent);

        return Result.ok(page);
    }
}

export const CreatePageUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreatePageUseCaseImpl,
    dependencies: [EventPublisher, CreatePageRepository]
});
