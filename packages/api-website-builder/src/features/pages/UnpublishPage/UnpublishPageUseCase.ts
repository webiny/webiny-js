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
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class UnpublishPageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private pageModel: PageModel.Interface,
        private repository: UnpublishPageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Get the page first for the before event
        const getResult = await this.getEntryById.execute(this.pageModel, params.id);

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(getResult.error));
        }

        const page = EntryToPageMapper.toPage(getResult.value);

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
    dependencies: [EventPublisher, GetEntryByIdUseCase, PageModel, UnpublishPageRepository]
});
