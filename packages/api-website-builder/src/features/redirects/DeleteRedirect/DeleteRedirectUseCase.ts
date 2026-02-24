import { Result, createImplementation } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import {
    DeleteRedirectUseCase as UseCaseAbstraction,
    DeleteRedirectRepository
} from "./abstractions.js";
import { RedirectBeforeDeleteEvent, RedirectAfterDeleteEvent } from "./events.js";
import { GetRedirectByIdUseCase } from "~/features/redirects/GetRedirectById/index.js";
import { WbPermissions } from "~/domain/permissions.js";
import { RedirectNotAuthorizedError } from "~/domain/redirect/errors.js";

class DeleteRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getRedirectById: GetRedirectByIdUseCase.Interface,
        private repository: DeleteRedirectRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Get the redirect first to include in events and for item-level permission check
        const getResult = await this.getRedirectById.execute(params.id);

        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const redirect = getResult.value;

        const canDelete = await this.permissions.canDelete("redirect", redirect);
        if (!canDelete) {
            return Result.fail(new RedirectNotAuthorizedError());
        }

        // Publish before delete event
        const beforeEvent = new RedirectBeforeDeleteEvent({
            redirect
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the delete operation
        const result = await this.repository.execute(params);

        if (result.isFail()) {
            return result;
        }

        // Publish after delete event
        const afterEvent = new RedirectAfterDeleteEvent({
            redirect
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok();
    }
}

export const DeleteRedirectUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteRedirectUseCaseImpl,
    dependencies: [
        WbPermissions.Abstraction,
        EventPublisher,
        GetRedirectByIdUseCase,
        DeleteRedirectRepository
    ]
});
