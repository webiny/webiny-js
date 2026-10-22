import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    DeleteLayoutRevisionRepository,
    DeleteLayoutRevisionUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { LayoutRevisionAfterDeleteEvent, LayoutRevisionBeforeDeleteEvent } from "./events.js";
import { GetLayoutRepository } from "~/features/layouts/GetLayout/index.js";
import { GetLayoutRevisionsRepository } from "~/features/layouts/GetLayoutRevisions/index.js";
import { GetLayoutUsageUseCase } from "~/features/layouts/GetLayoutUsage/index.js";
import { LayoutUsage } from "~/domain/layout/LayoutUsage.js";
import { DeleteLayoutUseCase } from "~/features/layouts/DeleteLayout/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutInUseError, LayoutNotAuthorizedError } from "~/domain/layout/errors.js";

class DeleteLayoutRevisionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getLayout: GetLayoutRepository.Interface,
        private getLayoutRevisions: GetLayoutRevisionsRepository.Interface,
        private getLayoutUsage: GetLayoutUsageUseCase.Interface,
        private deleteLayout: DeleteLayoutUseCase.Interface,
        private repository: DeleteLayoutRevisionRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canDelete("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        const getResult = await this.getLayout.execute(params.id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const layout = getResult.value;

        const canDelete = await this.permissions.canDelete("page", layout);
        if (!canDelete) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        // Deleting the only revision deletes the layout (with its language versions, for a source).
        const revisions = await this.getLayoutRevisions.execute(layout.entryId);
        if (revisions.isFail()) {
            return Result.fail(revisions.error);
        }
        if (revisions.value.length <= 1) {
            return this.deleteLayout.execute({ id: layout.entryId });
        }

        // Without its published revision, the layout is no longer rendered around the pages that use it.
        if (layout.status === "published") {
            const usage = await this.getLayoutUsage.execute(layout);
            if (usage.isFail()) {
                return Result.fail(usage.error);
            }
            if (LayoutUsage.from(usage.value).isInUse()) {
                return Result.fail(new LayoutInUseError({ id: layout.entryId, ...usage.value }));
            }
        }

        await this.eventPublisher.publish(new LayoutRevisionBeforeDeleteEvent({ layout }));

        const result = await this.repository.execute(layout.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new LayoutRevisionAfterDeleteEvent({ layout }));

        return Result.ok();
    }
}

export const DeleteLayoutRevisionUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteLayoutRevisionUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetLayoutRepository,
        GetLayoutRevisionsRepository,
        GetLayoutUsageUseCase,
        DeleteLayoutUseCase,
        DeleteLayoutRevisionRepository
    ]
});
