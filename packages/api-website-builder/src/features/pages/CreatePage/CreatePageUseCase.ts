import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { CreatePageUseCase as UseCaseAbstraction, CreatePageRepository } from "./abstractions.js";
import { PageBeforeCreateEvent, PageAfterCreateEvent } from "./events.js";

class CreatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private repository: CreatePageRepository.Interface
    ) {}

    async execute(data: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
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

export const CreatePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreatePageUseCaseImpl,
    dependencies: [EventPublisher, CreatePageRepository]
});
