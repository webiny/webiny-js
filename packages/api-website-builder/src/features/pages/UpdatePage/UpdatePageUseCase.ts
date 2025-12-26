import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { UpdatePageUseCase as UseCaseAbstraction, UpdatePageRepository } from "./abstractions.js";
import { PageBeforeUpdateEvent, PageAfterUpdateEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";

class UpdatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: UpdatePageRepository.Interface
    ) {}

    async execute(id: string, data: UseCaseAbstraction.UpdateData): UseCaseAbstraction.Return {
        // Get the original page for events
        const getResult = await this.getPageById.execute(id);

        if (getResult.isFail()) {
            return getResult;
        }

        const original = getResult.value;

        // Publish before update event
        const beforeEvent = new PageBeforeUpdateEvent({
            original,
            input: { id, data }
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the update operation
        const result = await this.repository.execute(id, data);

        if (result.isFail()) {
            return result;
        }

        // Publish after update event
        const afterEvent = new PageAfterUpdateEvent({
            original,
            input: { id, data },
            page: result.value
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(result.value);
    }
}

export const UpdatePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdatePageUseCaseImpl,
    dependencies: [EventPublisher, GetPageByIdUseCase, UpdatePageRepository]
});
