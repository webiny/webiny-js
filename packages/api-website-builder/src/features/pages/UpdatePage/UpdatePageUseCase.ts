import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { UpdatePageUseCase as UseCaseAbstraction, UpdatePageRepository } from "./abstractions.js";
import { PageBeforeUpdateEvent, PageAfterUpdateEvent } from "./events.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class UpdatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private pageModel: PageModel.Interface,
        private repository: UpdatePageRepository.Interface
    ) {}

    async execute(id: string, data: UseCaseAbstraction.UpdateData): UseCaseAbstraction.Return {
        // Get the original page for events
        const getResult = await this.getEntryById.execute(this.pageModel, id);

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(id));
            }
            return Result.fail(new PagePersistenceError(getResult.error));
        }

        const original = EntryToPageMapper.toPage(getResult.value);

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
    dependencies: [EventPublisher, GetEntryByIdUseCase, PageModel, UpdatePageRepository]
});
