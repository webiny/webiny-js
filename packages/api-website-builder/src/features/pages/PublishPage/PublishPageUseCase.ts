import { Result, createImplementation } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import { PublishPageUseCase as UseCaseAbstraction, PublishPageRepository } from "./abstractions.js";
import { PageBeforePublishEvent, PageAfterPublishEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { PageToEntryValuesMapper } from "~/domain/page/PageToEntryValuesMapper.js";

class PublishPageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: PublishPageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canPublish("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Get the page first for the before event
        const getResult = await this.getPageById.execute(params.id);

        if (getResult.isFail()) {
            return getResult;
        }

        const page = getResult.value;

        const canAccess = await this.permissions.canAccess("page", page);
        if (!canAccess) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Publish before publish event. Handlers can edit `page`, and that object is what we publish.
        const pageToPublish = structuredClone(page);
        const beforeEvent = new PageBeforePublishEvent({
            original: page,
            page: pageToPublish
        });

        await this.eventPublisher.publish(beforeEvent);

        const result = await this.repository.execute({
            id: params.id,
            values: PageToEntryValuesMapper.toValues(pageToPublish)
        });

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
    dependencies: [WbPermissions, EventPublisher, GetPageByIdUseCase, PublishPageRepository]
});
