import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { DeleteEntryRevisionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteEntryRevisionRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { GetPreviousRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPreviousRevisionByEntryId/index.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/DeleteEntry/index.js";
import type { CmsModel } from "~/types/index.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import {
    EntryRevisionBeforeDeleteEvent,
    EntryRevisionAfterDeleteEvent,
    EntryRevisionDeleteErrorEvent
} from "./events.js";
import { parseIdentifier } from "@webiny/utils";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * DeleteEntryRevisionUseCase - Orchestrates deletion of a specific entry revision.
 *
 * Responsibilities:
 * - Parse revision ID to extract entry ID and version
 * - Apply access control
 * - Get the revision to delete
 * - Determine if this is the latest revision
 * - If latest and no previous revision exists, perform full entry delete
 * - If latest and previous exists, set previous as new latest
 * - Publish domain events
 * - Delegate to repository for storage operations
 */
class DeleteEntryRevisionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: DeleteEntryRevisionRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface,
        private getPreviousRevision: GetPreviousRevisionByEntryIdUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(
        model: CmsModel,
        revisionId: string
    ): Promise<Result<void, UseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "d" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const { id: entryId, version } = parseIdentifier(revisionId);

        // Get the revision to delete
        const getRevisionResult = await this.getRevisionById.execute(model, revisionId);
        if (getRevisionResult.isFail()) {
            return Result.fail(getRevisionResult.error);
        }

        const entryToDelete = getRevisionResult.value;

        // Check access control on the specific entry
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry: entryToDelete,
            rwd: "d"
        });

        if (!canAccessEntry) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        // Get the latest revision
        const latestRevisionResult = await this.getLatestRevision.execute(model, { id: entryId });
        if (latestRevisionResult.isFail()) {
            return Result.fail(latestRevisionResult.error);
        }

        const latestRevision = latestRevisionResult.value;
        const latestRevisionId = latestRevision?.id || null;

        // Get the previous revision
        const previousRevisionResult = await this.getPreviousRevision.execute(model, {
            entryId,
            version: version as number
        });

        // If targeted record is the latest entry record and there is no previous revision,
        // delete the entire entry.
        const previousRevision = previousRevisionResult.isFail() ? null : previousRevisionResult.value;
        if (previousRevisionResult.isFail() && entryToDelete.id === latestRevisionId) {
            return await this.deleteEntry.execute(model, revisionId, {});
        }

        // Determine the entry to set as latest (if deleting current latest)
        let latestEntry = null;
        if (entryToDelete.id === latestRevisionId && previousRevision) {
            latestEntry = previousRevision;
        }

        try {
            // Publish before event
            await this.eventPublisher.publish(
                new EntryRevisionBeforeDeleteEvent({
                    entry: entryToDelete,
                    model
                })
            );

            // Delegate to repository
            const result = await this.repository.execute({
                model,
                entry: entryToDelete,
                latestEntry
            });

            if (result.isFail()) {
                await this.eventPublisher.publish(
                    new EntryRevisionDeleteErrorEvent({
                        entry: entryToDelete,
                        model,
                        error: result.error
                    })
                );
                return Result.fail(result.error);
            }

            // Publish after event
            await this.eventPublisher.publish(
                new EntryRevisionAfterDeleteEvent({
                    entry: entryToDelete,
                    model
                })
            );

            return Result.ok();
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryRevisionDeleteErrorEvent({
                    entry: entryToDelete,
                    model,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const DeleteEntryRevisionUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteEntryRevisionUseCaseImpl,
    dependencies: [
        DeleteEntryRevisionRepository,
        AccessControl,
        GetRevisionByIdUseCase,
        GetLatestRevisionByEntryIdIncludingDeletedUseCase,
        GetPreviousRevisionByEntryIdUseCase,
        DeleteEntryUseCase,
        EventPublisher
    ]
});
