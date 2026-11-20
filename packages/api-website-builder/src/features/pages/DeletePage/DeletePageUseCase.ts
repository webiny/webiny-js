import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import { DeletePageRepository, DeletePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { PageAfterDeleteEvent, PageBeforeDeleteEvent } from "./events.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { GetDeletedPageByIdUseCase } from "~/features/pages/GetDeletedPageById/index.js";

class DeletePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private getDeletedPageById: GetDeletedPageByIdUseCase.Interface,
        private repository: DeletePageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Get the page first to include in events and for item-level permission check: the page as
        // it is now, or from the trash bin. The CMS deletes the entry permanently either way.
        const liveResult = await this.getPageById.execute(params.id);
        const getResult =
            liveResult.isFail() && liveResult.error.code === "WebsiteBuilder/Page/NotFound"
                ? await this.getDeletedPageById.execute(params.id)
                : liveResult;

        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const page = getResult.value;

        const canDelete = await this.permissions.canDelete("page", page);
        if (!canDelete) {
            return Result.fail(new PageNotAuthorizedError());
        }

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

export const DeletePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeletePageUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetPageByIdUseCase,
        GetDeletedPageByIdUseCase,
        DeletePageRepository
    ]
});
