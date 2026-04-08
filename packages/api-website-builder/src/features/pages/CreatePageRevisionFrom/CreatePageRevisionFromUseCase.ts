import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import {
    CreatePageRevisionFromUseCase as UseCaseAbstraction,
    CreatePageRevisionFromRepository
} from "./abstractions.js";
import { PageBeforeCreateRevisionFromEvent, PageAfterCreateRevisionFromEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class CreatePageRevisionFromUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: CreatePageRevisionFromRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canCreate("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Verify ownership of the source page
        const getResult = await this.getPageById.execute(params.id);
        if (getResult.isFail()) {
            return getResult;
        }

        // Publish before event
        const beforeEvent = new PageBeforeCreateRevisionFromEvent({
            params
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the create revision operation
        const result = await this.repository.execute(params);

        if (result.isFail()) {
            return result;
        }

        const page = result.value;

        // Publish after event
        const afterEvent = new PageAfterCreateRevisionFromEvent({
            page
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(page);
    }
}

export const CreatePageRevisionFromUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreatePageRevisionFromUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetPageByIdUseCase,
        CreatePageRevisionFromRepository
    ]
});
