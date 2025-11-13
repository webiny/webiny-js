import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { RepublishEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RepublishEntryRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import {
    EntryBeforeRepublishEvent,
    EntryAfterRepublishEvent,
    EntryRepublishErrorEvent
} from "./events.js";
import { ContentEntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { createRepublishEntryData } from "~/crud/contentEntry/entryDataFactories/index.js";
import { CmsContext } from "~/features/shared/abstractions.js";

/**
 * RepublishEntryUseCase - Orchestrates republishing an entry.
 *
 * Responsibilities:
 * - Apply access control (both write and publish permissions)
 * - Get the entry to republish
 * - Prepare entry data with updated timestamps
 * - Publish domain events
 * - Delegate to repository for storage operations (update + publish)
 */
class RepublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: RepublishEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry, UseCaseAbstraction.Error>> {
        // Check access control (write and publish)
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w", pw: "p" });
        if (!canAccess) {
            return Result.fail(ContentEntryNotAuthorizedError.fromModel(model));
        }

        // Get the entry to republish
        const result = await this.getRevisionById.execute(model, id);

        if (result.isFail()) {
            return Result.fail(new EntryNotFoundError(id));
        }

        const originalEntry = result.value;

        // Check access control on the specific entry
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry: originalEntry,
            rwd: "w",
            pw: "p"
        });

        if (!canAccessEntry) {
            return Result.fail(ContentEntryNotAuthorizedError.fromModel(model));
        }

        // Prepare entry data for republishing
        const { entry } = await createRepublishEntryData({
            context: this.cmsContext,
            model,
            originalEntry,
            getIdentity: () => this.identityContext.getIdentity()
        });

        try {
            // Publish before event
            await this.eventPublisher.publish(
                new EntryBeforeRepublishEvent({
                    entry,
                    model
                })
            );

            // Delegate to repository (update + publish)
            const repositoryResult = await this.repository.execute(model, entry);

            if (repositoryResult.isFail()) {
                await this.eventPublisher.publish(
                    new EntryRepublishErrorEvent({
                        entry,
                        model,
                        error: repositoryResult.error
                    })
                );
                return Result.fail(repositoryResult.error);
            }

            const publishedEntry = repositoryResult.value;

            // Publish after event
            await this.eventPublisher.publish(
                new EntryAfterRepublishEvent({
                    entry: publishedEntry,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryRepublishErrorEvent({
                    entry,
                    model,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const RepublishEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: RepublishEntryUseCaseImpl,
    dependencies: [
        RepublishEntryRepository,
        AccessControl,
        GetRevisionByIdUseCase,
        IdentityContext,
        EventPublisher,
        CmsContext
    ]
});
