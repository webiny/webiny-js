import { Result, createImplementation } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { PublishPageUseCase as UseCaseAbstraction, PublishPageRepository } from "./abstractions.js";
import { PageBeforePublishEvent, PageAfterPublishEvent } from "./events.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class PublishPageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private pageModel: PageModel.Interface,
        private repository: PublishPageRepository.Interface
    ) {}

    async execute(params: PublishPageRepository.Params): UseCaseAbstraction.Return {
        // Get the page first for the before event
        const getResult = await this.getEntryById.execute(this.pageModel, params.id);

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(getResult.error));
        }

        const page = EntryToPageMapper.toPage(getResult.value);

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
    dependencies: [EventPublisher, GetEntryByIdUseCase, PageModel, PublishPageRepository]
});
