import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    UpdateRedirectUseCase as UseCaseAbstraction,
    UpdateRedirectRepository
} from "./abstractions.js";
import { RedirectBeforeUpdateEvent, RedirectAfterUpdateEvent } from "./events.js";
import { GetRedirectByIdUseCase } from "~/features/redirects/GetRedirectById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { RedirectNotAuthorizedError } from "~/domain/redirect/errors.js";

class UpdateRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getRedirectById: GetRedirectByIdUseCase.Interface,
        private repository: UpdateRedirectRepository.Interface
    ) {}

    async execute(id: string, data: UseCaseAbstraction.UpdateData): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canEdit("redirect");
        if (!hasPermission) {
            return Result.fail(new RedirectNotAuthorizedError());
        }

        // Get the original redirect for events
        const getResult = await this.getRedirectById.execute(id);

        if (getResult.isFail()) {
            return getResult;
        }

        const original = getResult.value;

        const canEdit = await this.permissions.canEdit("redirect", original);
        if (!canEdit) {
            return Result.fail(new RedirectNotAuthorizedError());
        }

        // Publish before update event
        const beforeEvent = new RedirectBeforeUpdateEvent({
            original,
            input: { id, data }
        });

        await this.eventPublisher.publish(beforeEvent);

        // Execute the update operation
        const result = await this.repository.execute(id, data);

        if (result.isFail()) {
            return result;
        }

        // Publish after update event
        const afterEvent = new RedirectAfterUpdateEvent({
            original,
            input: { id, data },
            redirect: result.value
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(result.value);
    }
}

export const UpdateRedirectUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateRedirectUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, GetRedirectByIdUseCase, UpdateRedirectRepository]
});
