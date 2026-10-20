import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import { CreatePageUseCase as UseCaseAbstraction, CreatePageRepository } from "./abstractions.js";
import { PageBeforeCreateEvent, PageAfterCreateEvent } from "./events.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class CreatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private repository: CreatePageRepository.Interface
    ) {}

    async execute(data: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canCreate("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Publish before create event. Handlers can edit `page`, and that object is what we save.
        const pageToCreate = structuredClone(data);
        const beforeCreateEvent = new PageBeforeCreateEvent({ input: data, page: pageToCreate });

        await this.eventPublisher.publish(beforeCreateEvent);

        const result = await this.repository.execute(pageToCreate);

        if (result.isFail()) {
            return result;
        }

        const page = result.value;

        // Publish after create event
        const afterCreateEvent = new PageAfterCreateEvent({ page });

        await this.eventPublisher.publish(afterCreateEvent);

        return Result.ok(page);
    }
}

export const CreatePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreatePageUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, CreatePageRepository]
});
