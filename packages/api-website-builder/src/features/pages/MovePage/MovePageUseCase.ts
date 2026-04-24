import { Result, createImplementation } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import { MovePageUseCase as UseCaseAbstraction, MovePageRepository } from "./abstractions.js";
import { PageBeforeMoveEvent, PageAfterMoveEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class MovePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: MovePageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canEdit("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Get the original page for events
        const getResult = await this.getPageById.execute(params.id);

        if (getResult.isFail()) {
            return getResult;
        }

        const original = getResult.value;

        const canEdit = await this.permissions.canEdit("page", original);
        if (!canEdit) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Publish before move event
        const beforeEvent = new PageBeforeMoveEvent({
            original,
            input: params
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the move operation
        const result = await this.repository.execute(params);

        if (result.isFail()) {
            return result;
        }

        // Publish after move event
        const afterEvent = new PageAfterMoveEvent({
            original,
            input: params,
            page: result.value
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(result.value);
    }
}

export const MovePageUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: MovePageUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, GetPageByIdUseCase, MovePageRepository]
});
