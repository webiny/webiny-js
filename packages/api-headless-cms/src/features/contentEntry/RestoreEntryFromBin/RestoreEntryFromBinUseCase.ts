import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { RestoreEntryFromBinUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RestoreEntryFromBinRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetLatestDeletedRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import {
    EntryBeforeRestoreFromBinEvent,
    EntryAfterRestoreFromBinEvent,
    EntryRestoreFromBinErrorEvent
} from "./events.js";
import { NotAuthorizedError } from "~/utils/errors.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { getDate } from "~/utils/date.js";
import { getIdentity } from "~/utils/identity.js";

/**
 * RestoreEntryFromBinUseCase - Orchestrates restoring a soft-deleted entry from the bin.
 *
 * Responsibilities:
 * - Apply access control
 * - Get the deleted entry to restore by ID
 * - Clear deletion flags (wbyDeleted = false)
 * - Restore entry to its original folder
 * - Update restoration metadata
 * - Publish domain events
 * - Delegate to repository for storage operations
 */
class RestoreEntryFromBinUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: RestoreEntryFromBinRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getDeletedEntry: GetLatestDeletedRevisionByEntryIdUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry, UseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(NotAuthorizedError.fromModel(model));
        }

        // Get the deleted entry to restore by ID
        const getResult = await this.getDeletedEntry.execute(model, { id });

        if (getResult.isFail()) {
            return Result.fail(new EntryNotFoundError(id));
        }

        const originalEntry = getResult.value;

        // Check access control on the specific entry
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry: originalEntry,
            rwd: "w"
        });

        if (!canAccessEntry) {
            return Result.fail(NotAuthorizedError.fromModel(model));
        }

        // Create the restored entry data
        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.identityContext.getIdentity();

        const entryToRestore: CmsEntry = {
            ...originalEntry,
            wbyDeleted: false,

            // Entry location fields - restore to original folder
            location: {
                folderId: originalEntry.binOriginalFolderId
            },
            binOriginalFolderId: null,

            // Entry-level meta fields
            restoredOn: getDate(currentDateTime, null),
            restoredBy: getIdentity(currentIdentity, null),

            // Revision-level meta fields
            revisionRestoredOn: getDate(currentDateTime, null),
            revisionRestoredBy: getIdentity(currentIdentity, null)
        };

        try {
            // Publish before event
            await this.eventPublisher.publish(
                new EntryBeforeRestoreFromBinEvent({
                    entry: entryToRestore,
                    model
                })
            );

            // Delegate to repository
            const result = await this.repository.execute(model, entryToRestore);

            if (result.isFail()) {
                await this.eventPublisher.publish(
                    new EntryRestoreFromBinErrorEvent({
                        entry: entryToRestore,
                        model,
                        error: result.error
                    })
                );
                return Result.fail(result.error);
            }

            const restoredEntry = result.value;

            // Publish after event
            await this.eventPublisher.publish(
                new EntryAfterRestoreFromBinEvent({
                    entry: restoredEntry,
                    model
                })
            );

            return Result.ok(restoredEntry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryRestoreFromBinErrorEvent({
                    entry: entryToRestore,
                    model,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const RestoreEntryFromBinUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: RestoreEntryFromBinUseCaseImpl,
    dependencies: [
        RestoreEntryFromBinRepository,
        AccessControl,
        GetLatestDeletedRevisionByEntryIdUseCase,
        IdentityContext,
        EventPublisher
    ]
});
