import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    DeleteLayoutRepository,
    DeleteLayoutUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { LayoutAfterDeleteEvent, LayoutBeforeDeleteEvent } from "./events.js";
import { GetLayoutUseCase } from "~/features/layouts/GetLayout/index.js";
import { ListLayoutsRepository } from "~/features/layouts/ListLayouts/index.js";
import { GetLayoutUsageUseCase } from "~/features/layouts/GetLayoutUsage/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import {
    LayoutInUseError,
    LayoutNotAuthorizedError,
    LayoutPersistenceError
} from "~/domain/layout/errors.js";
import { LayoutEntryId } from "~/domain/layout/LayoutEntryId.js";
import { LayoutLineage } from "~/domain/layout/LayoutLineage.js";
import type { Layout } from "~/domain/layout/abstractions.js";

class DeleteLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getLayout: GetLayoutUseCase.Interface,
        private listLayouts: ListLayoutsRepository.Interface,
        private getLayoutUsage: GetLayoutUsageUseCase.Interface,
        private repository: DeleteLayoutRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canDelete("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        // Reading the layout enforces the read and access checks.
        const getResult = await this.getLayout.execute(LayoutEntryId.from(params.id).toString());
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const layout = getResult.value;

        const canDelete = await this.permissions.canDelete("page", layout);
        if (!canDelete) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        // A source's usage covers the usage of all its language versions.
        const usage = await this.getLayoutUsage.execute(layout);
        if (usage.isFail()) {
            return Result.fail(usage.error);
        }
        if (usage.value.pages > 0 || usage.value.isDefault) {
            return Result.fail(new LayoutInUseError({ id: layout.entryId, ...usage.value }));
        }

        const versions: Layout[] = [];
        if (LayoutLineage.from(layout).isSource()) {
            // Every version, including ones the caller doesn't own: each must pass `canDelete` below,
            // so a version the caller may not delete blocks the delete instead of being left behind.
            const all = await this.listLayouts.execute();
            if (all.isFail()) {
                return Result.fail(all.error);
            }
            versions.push(
                ...all.value.filter(item => LayoutLineage.from(item).isVersionOf(layout))
            );
        }

        // Language versions go with their source, so each must be deletable before anything is deleted.
        for (const item of versions) {
            if (!(await this.permissions.canDelete("page", item))) {
                return Result.fail(new LayoutNotAuthorizedError());
            }
        }

        // Versions are deleted before their source, and a failed one doesn't stop the others. The
        // source is only deleted once all its versions are gone, so a failure never leaves a version
        // without its source, and deleting again finishes the job.
        const failures: UseCaseAbstraction.Error[] = [];
        for (const item of versions) {
            const result = await this.deleteOne(item);
            if (result.isFail()) {
                failures.push(result.error);
            }
        }

        if (failures.length) {
            if (failures.length === 1) {
                return Result.fail(failures[0]);
            }
            const message = failures.map(error => error.message).join(" ");
            return Result.fail(new LayoutPersistenceError(new Error(message)));
        }

        return this.deleteOne(layout);
    }

    private async deleteOne(layout: Layout) {
        await this.eventPublisher.publish(new LayoutBeforeDeleteEvent({ layout }));

        const result = await this.repository.execute(layout.entryId);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new LayoutAfterDeleteEvent({ layout }));

        return result;
    }
}

export const DeleteLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteLayoutUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetLayoutUseCase,
        ListLayoutsRepository,
        GetLayoutUsageUseCase,
        DeleteLayoutRepository
    ]
});
