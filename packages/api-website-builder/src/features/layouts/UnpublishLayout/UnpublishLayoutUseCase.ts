import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    UnpublishLayoutRepository,
    UnpublishLayoutUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { LayoutAfterUnpublishEvent, LayoutBeforeUnpublishEvent } from "./events.js";
import { GetLayoutRepository } from "~/features/layouts/GetLayout/index.js";
import { GetPublishedLayoutRepository } from "~/features/layouts/GetPageLayout/index.js";
import { GetLayoutUsageUseCase } from "~/features/layouts/GetLayoutUsage/index.js";
import { LayoutUsage } from "~/domain/layout/LayoutUsage.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import {
    LayoutInUseError,
    LayoutNotAuthorizedError,
    LayoutValidationError
} from "~/domain/layout/errors.js";
import { LayoutEntryId } from "~/domain/layout/LayoutEntryId.js";

class UnpublishLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getLayout: GetLayoutRepository.Interface,
        private getPublishedLayout: GetPublishedLayoutRepository.Interface,
        private getLayoutUsage: GetLayoutUsageUseCase.Interface,
        private repository: UnpublishLayoutRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canUnpublish("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        const getResult = await this.getLayout.execute(params.id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        let layout = getResult.value;

        const canAccess = await this.permissions.canAccess("page", layout);
        if (!canAccess) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        // An entry id unpublishes whichever revision is published.
        if (!LayoutEntryId.isRevisionId(params.id) && layout.status !== "published") {
            const published = await this.getPublishedLayout.execute(layout.entryId);
            if (published.isFail()) {
                return Result.fail(published.error);
            }
            if (published.value) {
                layout = published.value;
            }
        }

        if (layout.status !== "published") {
            return Result.fail(
                new LayoutValidationError(`Layout revision "${layout.id}" is not published.`)
            );
        }

        const usage = await this.getLayoutUsage.execute(layout);
        if (usage.isFail()) {
            return Result.fail(usage.error);
        }
        if (LayoutUsage.from(usage.value).isInUse()) {
            return Result.fail(new LayoutInUseError({ id: layout.entryId, ...usage.value }));
        }

        await this.eventPublisher.publish(new LayoutBeforeUnpublishEvent({ layout }));

        const result = await this.repository.execute(layout.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const unpublished = { ...result.value, live: null };

        await this.eventPublisher.publish(new LayoutAfterUnpublishEvent({ layout: unpublished }));

        return Result.ok(unpublished);
    }
}

export const UnpublishLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: UnpublishLayoutUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetLayoutRepository,
        GetPublishedLayoutRepository,
        GetLayoutUsageUseCase,
        UnpublishLayoutRepository
    ]
});
