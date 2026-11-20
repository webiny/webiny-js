import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    PublishLayoutRepository,
    PublishLayoutUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { LayoutAfterPublishEvent, LayoutBeforePublishEvent } from "./events.js";
import { GetLayoutRepository } from "~/features/layouts/GetLayout/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutNotAuthorizedError } from "~/domain/layout/errors.js";

class PublishLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getLayout: GetLayoutRepository.Interface,
        private repository: PublishLayoutRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canPublish("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        const getResult = await this.getLayout.execute(params.id);
        if (getResult.isFail()) {
            return getResult;
        }

        const layout = getResult.value;

        const canAccess = await this.permissions.canAccess("page", layout);
        if (!canAccess) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        await this.eventPublisher.publish(new LayoutBeforePublishEvent({ layout }));

        const result = await this.repository.execute(layout.id);
        if (result.isFail()) {
            return result;
        }

        const published = { ...result.value, live: { version: result.value.version } };

        await this.eventPublisher.publish(new LayoutAfterPublishEvent({ layout: published }));

        return Result.ok(published);
    }
}

export const PublishLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: PublishLayoutUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, GetLayoutRepository, PublishLayoutRepository]
});
