import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import { UpdatePageUseCase as UseCaseAbstraction, UpdatePageRepository } from "./abstractions.js";
import { PageBeforeUpdateEvent, PageAfterUpdateEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class UpdatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: UpdatePageRepository.Interface
    ) {}

    async execute(id: string, data: UseCaseAbstraction.UpdateData): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canEdit("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Get the original page for events
        const getResult = await this.getPageById.execute(id);

        if (getResult.isFail()) {
            return getResult;
        }

        const original = getResult.value;

        const canEdit = await this.permissions.canEdit("page", original);
        if (!canEdit) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Publish before update event
        const beforeEvent = new PageBeforeUpdateEvent({
            original,
            input: { id, data }
        });

        await this.eventPublisher.publish(beforeEvent);

        // Update with the data as the handlers left it.
        const result = await this.repository.execute(id, beforeEvent.payload.input.data);

        if (result.isFail()) {
            return result;
        }

        // Publish after update event
        const afterEvent = new PageAfterUpdateEvent({
            original,
            input: beforeEvent.payload.input,
            page: result.value
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(result.value);
    }
}

export const UpdatePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdatePageUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, GetPageByIdUseCase, UpdatePageRepository]
});
