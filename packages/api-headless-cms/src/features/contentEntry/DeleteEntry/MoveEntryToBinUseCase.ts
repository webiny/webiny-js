import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { MoveEntryToBinUseCase as UseCaseAbstraction } from "./abstractions.js";
import { MoveEntryToBinRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type { CmsModel } from "~/types/index.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { EntryBeforeDeleteEvent, EntryAfterDeleteEvent, EntryDeleteErrorEvent } from "./events.js";
import { ContentEntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { getDate } from "~/utils/date.js";
import { getIdentity } from "~/utils/identity.js";
import { ROOT_FOLDER } from "~/constants.js";

/**
 * MoveEntryToBinUseCase - Orchestrates soft deletion of an entry (move to bin).
 *
 * Responsibilities:
 * - Apply access control
 * - Get the entry to delete by ID
 * - Mark entry as deleted (wbyDeleted = true)
 * - Update deletion metadata
 * - Publish domain events with permanent: false
 * - Delegate to repository for storage operations
 */
class MoveEntryToBinUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: MoveEntryToBinRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(model: CmsModel, id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "d" });
        if (!canAccess) {
            return Result.fail(ContentEntryNotAuthorizedError.fromModel(model));
        }

        // Get the entry to delete by ID
        const getResult = await this.getLatestRevision.execute(model, { id });

        if (getResult.isFail()) {
            return Result.fail(new EntryNotFoundError(id));
        }

        const originalEntry = getResult.value;

        // Check access control on the specific entry
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry: originalEntry,
            rwd: "d"
        });

        if (!canAccessEntry) {
            return Result.fail(new ContentEntryNotAuthorizedError());
        }

        // Create the deleted entry data
        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.identityContext.getIdentity();

        const entryToDelete = {
            ...originalEntry,
            wbyDeleted: true,

            // Entry location fields - move to root folder
            location: {
                folderId: ROOT_FOLDER
            },
            binOriginalFolderId: originalEntry.location?.folderId,

            // Entry-level meta fields
            deletedOn: getDate(currentDateTime, null),
            deletedBy: getIdentity(currentIdentity, null),

            // Revision-level meta fields
            revisionDeletedOn: getDate(currentDateTime, null),
            revisionDeletedBy: getIdentity(currentIdentity, null)
        };

        try {
            // Publish before event
            await this.eventPublisher.publish(
                new EntryBeforeDeleteEvent({
                    entry: entryToDelete,
                    model,
                    permanent: false
                })
            );

            // Delegate to repository
            const result = await this.repository.execute({
                model,
                entry: entryToDelete
            });

            if (result.isFail()) {
                await this.eventPublisher.publish(
                    new EntryDeleteErrorEvent({
                        entry: entryToDelete,
                        model,
                        permanent: false,
                        error: result.error
                    })
                );
                return Result.fail(result.error);
            }

            // Publish after event
            await this.eventPublisher.publish(
                new EntryAfterDeleteEvent({
                    entry: entryToDelete,
                    model,
                    permanent: false
                })
            );

            return Result.ok();
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryDeleteErrorEvent({
                    entry: entryToDelete,
                    model,
                    permanent: false,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const MoveEntryToBinUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: MoveEntryToBinUseCaseImpl,
    dependencies: [
        MoveEntryToBinRepository,
        AccessControl,
        GetLatestRevisionByEntryIdUseCase,
        IdentityContext,
        EventPublisher
    ]
});
