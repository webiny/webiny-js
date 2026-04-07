import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { TrashPageUseCase as UseCaseAbstraction, TrashPageRepository } from "./abstractions.js";
import { PageBeforeTrashEvent, PageAfterTrashEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class TrashPageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: TrashPageRepository.Interface
    ) {}

    public async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
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
        const beforeEvent = new PageBeforeTrashEvent({
            page
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the delete operation
        const result = await this.repository.execute(params);

        if (result.isFail()) {
            return result;
        }

        // Publish after delete event
        const afterEvent = new PageAfterTrashEvent({
            page
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok();
    }
}

export const TrashPageUseCase = UseCaseAbstraction.createImplementation({
    implementation: TrashPageUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, GetPageByIdUseCase, TrashPageRepository]
});
