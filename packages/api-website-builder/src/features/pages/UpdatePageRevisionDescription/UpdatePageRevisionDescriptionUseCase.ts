import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    UpdatePageRevisionDescriptionRepository,
    UpdatePageRevisionDescriptionUseCase as UseCaseAbstraction
} from "./abstractions.js";
import {
    PageAfterUpdateRevisionDescriptionEvent,
    PageBeforeUpdateRevisionDescriptionEvent
} from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class UpdatePageRevisionDescriptionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: UpdatePageRevisionDescriptionRepository.Interface
    ) {}

    async execute(id: string, revisionDescription: string): UseCaseAbstraction.Return {
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
        const beforeEvent = new PageBeforeUpdateRevisionDescriptionEvent({
            original,
            input: {
                id,
                revisionDescription
            }
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the update operation
        const result = await this.repository.execute(id, revisionDescription);

        if (result.isFail()) {
            return result;
        }

        // Publish after update event
        const afterEvent = new PageAfterUpdateRevisionDescriptionEvent({
            original,
            input: {
                id,
                revisionDescription
            },
            page: result.value
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(result.value);
    }
}

export const UpdatePageRevisionDescriptionUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdatePageRevisionDescriptionUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetPageByIdUseCase,
        UpdatePageRevisionDescriptionRepository
    ]
});
