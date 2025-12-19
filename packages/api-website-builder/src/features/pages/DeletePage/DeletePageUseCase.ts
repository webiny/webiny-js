import { Result, createImplementation } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { DeletePageUseCase as UseCaseAbstraction, DeletePageRepository } from "./abstractions.js";
import { PageBeforeDeleteEvent, PageAfterDeleteEvent } from "./events.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class DeletePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private pageModel: PageModel.Interface,
        private repository: DeletePageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Get the page first to include in events
        const getResult = await this.getEntryById.execute(this.pageModel, params.id);

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(getResult.error));
        }

        const page = EntryToPageMapper.toPage(getResult.value);

        // Publish before delete event
        const beforeEvent = new PageBeforeDeleteEvent({
            page
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the delete operation
        const result = await this.repository.execute(params);

        if (result.isFail()) {
            return result;
        }

        // Publish after delete event
        const afterEvent = new PageAfterDeleteEvent({
            page
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok();
    }
}

export const DeletePageUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeletePageUseCaseImpl,
    dependencies: [EventPublisher, GetEntryByIdUseCase, PageModel, DeletePageRepository]
});
