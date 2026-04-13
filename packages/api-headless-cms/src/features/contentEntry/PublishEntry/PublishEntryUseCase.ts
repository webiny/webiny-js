import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { PublishEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { PublishEntryRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import {
    EntryBeforePublishEvent,
    EntryAfterPublishEvent,
    EntryPublishErrorEvent
} from "./events.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { createPublishEntryData } from "~/crud/contentEntry/entryDataFactories/index.js";
import { CmsContext } from "~/features/shared/abstractions.js";

/**
 * PublishEntryUseCase - Orchestrates publishing an entry.
 *
 * Responsibilities:
 * - Apply access control (publish permission)
 * - Get the entry to publish
 * - Get the latest revision for entry-level metadata
 * - Prepare entry data with publish metadata
 * - Validate entry data
 * - Publish domain events
 * - Delegate to repository for storage operations
 */
class PublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: PublishEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        // Check access control (publish permission)
        const canAccess = await this.accessControl.canAccessEntry({ model, pw: "p" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        // Get the entry to publish
        const result = await this.getRevisionById.execute<T>(model, id);

        if (result.isFail()) {
            return Result.fail(new EntryNotFoundError(id));
        }

        const originalEntry = result.value;

        // Check access control on the specific entry
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry: originalEntry,
            pw: "p"
        });

        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        // Get the latest revision for entry-level metadata
        const latestResult = await this.getLatestRevision.execute<T>(model, {
            id: originalEntry.entryId
        });

        if (latestResult.isFail()) {
            return Result.fail(latestResult.error);
        }

        const latestEntry = latestResult.value;

        // Prepare entry data for publishing (includes validation)
        const { entry } = await createPublishEntryData<T>({
            context: this.cmsContext,
            model,
            originalEntry,
            latestEntry,
            getIdentity: () => this.identityContext.getIdentity()
        });

        try {
            // Publish before event
            await this.eventPublisher.publish(
                new EntryBeforePublishEvent({
                    entry,
                    original: originalEntry,
                    model
                })
            );

            // Delegate to repository
            const repositoryResult = await this.repository.execute(model, entry);

            if (repositoryResult.isFail()) {
                await this.eventPublisher.publish(
                    new EntryPublishErrorEvent({
                        entry,
                        original: originalEntry,
                        model,
                        error: repositoryResult.error
                    })
                );
                return Result.fail(repositoryResult.error);
            }

            const publishedEntry = repositoryResult.value;

            // Publish after event
            await this.eventPublisher.publish(
                new EntryAfterPublishEvent({
                    entry: publishedEntry,
                    original: originalEntry,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryPublishErrorEvent({
                    entry,
                    original: originalEntry,
                    model,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const PublishEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: PublishEntryUseCaseImpl,
    dependencies: [
        PublishEntryRepository,
        AccessControl,
        GetRevisionByIdUseCase,
        GetLatestRevisionByEntryIdUseCase,
        IdentityContext,
        EventPublisher,
        CmsContext
    ]
});
