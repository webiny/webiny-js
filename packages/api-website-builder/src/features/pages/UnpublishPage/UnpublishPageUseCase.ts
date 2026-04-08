import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    UnpublishPageUseCase as UseCaseAbstraction,
    UnpublishPageRepository
} from "./abstractions.js";
import { PageBeforeUnpublishEvent, PageAfterUnpublishEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class UnpublishPageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: UnpublishPageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canUnpublish("page");
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
    dependencies: [WbPermissions, EventPublisher, GetPageByIdUseCase, UnpublishPageRepository]
});
