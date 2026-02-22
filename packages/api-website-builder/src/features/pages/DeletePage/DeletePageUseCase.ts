import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { DeletePageUseCase as UseCaseAbstraction, DeletePageRepository } from "./abstractions.js";
import { PageBeforeDeleteEvent, PageAfterDeleteEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { WbPermissions } from "~/domain/permissions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class DeletePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: DeletePageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Get the page first to include in events and for item-level permission check
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
        GetPageByIdUseCase,
        DeletePageRepository
    ]
});
