import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    DeletePageRevisionRepository,
    DeletePageRevisionUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { PageRevisionAfterDeleteEvent, PageRevisionBeforeDeleteEvent } from "./events.js";
import { PageAfterDeleteEvent, PageBeforeDeleteEvent } from "~/features/pages/DeletePage/events.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { GetPageRevisionsUseCase } from "~/features/pages/GetPageRevisions/index.js";

class DeletePageRevisionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private getPageRevisions: GetPageRevisionsUseCase.Interface,
        private repository: DeletePageRevisionRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Read the revision first: the events carry it, and the permission check is item-level.
        const getResult = await this.getPageById.execute(params.id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }
        const page = getResult.value;

        const canDelete = await this.permissions.canDelete("page", page);
        if (!canDelete) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // A page with one revision is deleted with it, so the page-delete subscribers must run too.
        const revisionsResult = await this.getPageRevisions.execute(page.entryId);
        if (revisionsResult.isFail()) {
            return Result.fail(revisionsResult.error);
        }
        const isOnlyRevision = revisionsResult.value.length === 1;

        // A handler that throws refuses the delete, as in `DeletePageUseCase`.
        await this.eventPublisher.publish(new PageRevisionBeforeDeleteEvent({ page }));
        if (isOnlyRevision) {
            await this.eventPublisher.publish(new PageBeforeDeleteEvent({ page }));
        }

        const result = await this.repository.execute(params);
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(new PageRevisionAfterDeleteEvent({ page }));
        if (isOnlyRevision) {
            await this.eventPublisher.publish(new PageAfterDeleteEvent({ page }));
        }

        return Result.ok();
    }
}

export const DeletePageRevisionUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeletePageRevisionUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetPageByIdUseCase,
        GetPageRevisionsUseCase,
        DeletePageRevisionRepository
    ]
});
