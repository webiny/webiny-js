import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { DeletePageRepository, DeletePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { PageAfterDeleteEvent, PageBeforeDeleteEvent } from "./events.js";
import { WbPermissions } from "~/domain/permissions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { GetDeletedPageByIdUseCase } from "~/features/pages/GetDeletedPageById/index.js";

class DeletePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getDeletedPageById: GetDeletedPageByIdUseCase.Interface,
        private repository: DeletePageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Get the page first to include in events and for item-level permission check
        const getResult = await this.getDeletedPageById.execute(params.id);

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
        WbPermissions.Abstraction,
        EventPublisher,
        GetDeletedPageByIdUseCase,
        DeletePageRepository
    ]
});
