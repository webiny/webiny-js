import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    DeletePageRevisionRepository,
    DeletePageRevisionUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { PageRevisionAfterDeleteEvent, PageRevisionBeforeDeleteEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class DeletePageRevisionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: DeletePageRevisionRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Get the revision first to include in events and for the item-level permission check.
        const getResult = await this.getPageById.execute(params.id);

        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const page = getResult.value;

        const canDelete = await this.permissions.canDelete("page", page);
        if (!canDelete) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Publish before delete event
        const beforeEvent = new PageRevisionBeforeDeleteEvent({
            page
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the delete operation
        const result = await this.repository.execute(params);

        if (result.isFail()) {
            return result;
        }

        // Publish after delete event
        const afterEvent = new PageRevisionAfterDeleteEvent({
            page
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok();
    }
}

export const DeletePageRevisionUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeletePageRevisionUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, GetPageByIdUseCase, DeletePageRevisionRepository]
});
