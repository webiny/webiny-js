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

class DeleteRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getRedirectById: GetRedirectByIdUseCase.Interface,
        private repository: DeleteRedirectRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Get the redirect first to include in events
        const getResult = await this.getRedirectById.execute(params.id);

        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const redirect = getResult.value;

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
    dependencies: [EventPublisher, GetRedirectByIdUseCase, DeleteRedirectRepository]
});
