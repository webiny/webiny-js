import { Result, createImplementation } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import {
    DuplicatePageUseCase as UseCaseAbstraction,
    DuplicatePageRepository
} from "./abstractions.js";
import { PageBeforeDuplicateEvent, PageAfterDuplicateEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";

class DuplicatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: DuplicatePageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Get the original page for events
        const getResult = await this.getPageById.execute(params.id);

        if (getResult.isFail()) {
            return getResult;
        }

        const original = getResult.value;

        // Publish before duplicate event
        const beforeEvent = new PageBeforeDuplicateEvent({
            original
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the duplicate operation
        const result = await this.repository.execute(params);

        if (result.isFail()) {
            return result;
        }

        // Publish after duplicate event
        const afterEvent = new PageAfterDuplicateEvent({
            original,
            page: result.value
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(result.value);
    }
}

export const DuplicatePageUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DuplicatePageUseCaseImpl,
    dependencies: [EventPublisher, GetPageByIdUseCase, DuplicatePageRepository]
});
