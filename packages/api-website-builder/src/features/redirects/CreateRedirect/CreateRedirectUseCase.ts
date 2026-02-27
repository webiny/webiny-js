import { Result, createImplementation } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import {
    CreateRedirectUseCase as UseCaseAbstraction,
    CreateRedirectRepository
} from "./abstractions.js";
import { RedirectBeforeCreateEvent, RedirectAfterCreateEvent } from "./events.js";
import { WbPermissions } from "~/domain/permissions.js";
import { RedirectNotAuthorizedError } from "~/domain/redirect/errors.js";

class CreateRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private repository: CreateRedirectRepository.Interface
    ) {}

    async execute(data: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canCreate("redirect");
        if (!hasPermission) {
            return Result.fail(new RedirectNotAuthorizedError());
        }

        // Publish before create event
        const beforeCreateEvent = new RedirectBeforeCreateEvent({ input: data });
        await this.eventPublisher.publish(beforeCreateEvent);

        // Execute the create operation
        const result = await this.repository.execute(data);

        if (result.isFail()) {
            return result;
        }

        // Publish after create event
        const afterCreateEvent = new RedirectAfterCreateEvent({ redirect: result.value });
        await this.eventPublisher.publish(afterCreateEvent);

        return Result.ok(result.value);
    }
}

export const CreateRedirectUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateRedirectUseCaseImpl,
    dependencies: [WbPermissions.Abstraction, EventPublisher, CreateRedirectRepository]
});
