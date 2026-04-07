import { Result, createImplementation } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import {
    MoveRedirectUseCase as UseCaseAbstraction,
    MoveRedirectRepository
} from "./abstractions.js";
import { RedirectBeforeMoveEvent, RedirectAfterMoveEvent } from "./events.js";
import { GetRedirectByIdUseCase } from "~/features/redirects/GetRedirectById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { RedirectNotAuthorizedError } from "~/domain/redirect/errors.js";

class MoveRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getRedirectById: GetRedirectByIdUseCase.Interface,
        private repository: MoveRedirectRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canEdit("redirect");
        if (!hasPermission) {
            return Result.fail(new RedirectNotAuthorizedError());
        }

        // Get the original redirect for events
        const getResult = await this.getRedirectById.execute(params.id);

        if (getResult.isFail()) {
            return getResult;
        }

        const original = getResult.value;

        const canEdit = await this.permissions.canEdit("redirect", original);
        if (!canEdit) {
            return Result.fail(new RedirectNotAuthorizedError());
        }

        // Publish before move event
        const beforeEvent = new RedirectBeforeMoveEvent({
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
        const afterEvent = new RedirectAfterMoveEvent({
            original,
            input: params,
            redirect: result.value
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(result.value);
    }
}

export const MoveRedirectUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: MoveRedirectUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, GetRedirectByIdUseCase, MoveRedirectRepository]
});
