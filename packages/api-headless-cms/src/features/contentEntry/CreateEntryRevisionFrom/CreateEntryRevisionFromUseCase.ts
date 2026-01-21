import { createImplementation, Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import {
    CreateEntryRevisionFromRepository,
    CreateEntryRevisionFromUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import {
    EntryRevisionAfterCreateEvent,
    EntryRevisionBeforeCreateEvent,
    EntryRevisionCreateErrorEvent
} from "./events.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { parseIdentifier } from "@webiny/utils";
import { createEntryRevisionFromData } from "~/crud/contentEntry/entryDataFactories/index.js";

/**
 * CreateEntryRevisionFromUseCase - Orchestrates creating a new revision from an existing entry.
 *
 * Responsibilities:
 * - Apply access control
 * - Get the source entry
 * - Get the latest revision for version calculation
 * - Prepare entry data with new version
 * - Validate entry data
 * - Apply additional access control based on status
 * - Publish domain events
 * - Delegate to repository for storage operations
 */
class CreateEntryRevisionFromUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: CreateEntryRevisionFromRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        sourceId: string,
        rawInput: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        // Get the source entry
        const { id: uniqueId } = parseIdentifier(sourceId);
        const originalResult = await this.getRevisionById.execute<T>(model, sourceId);

        if (originalResult.isFail()) {
            return Result.fail(originalResult.error);
        }

        const originalEntry = originalResult.value;

        // Get the latest revision for version calculation
        const latestResult = await this.getLatestRevision.execute<T>(model, { id: uniqueId });

        if (latestResult.isFail()) {
            return Result.fail(latestResult.error);
        }

        const latestStorageEntry = latestResult.value;

        // Prepare entry data
        const { entry, input } = await createEntryRevisionFromData<T>({
            sourceId,
            model,
            rawInput,
            options,
            context: this.cmsContext,
            getIdentity: () => this.identityContext.getIdentity(),
            getTenant: () => this.tenantContext.getTenant(),
            originalEntry,
            latestStorageEntry,
            accessControl: this.accessControl as any
        });

        // Check access control on the prepared entry
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry,
            rwd: "w"
        });

        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        try {
            // Publish before event
            await this.eventPublisher.publish(
                new EntryRevisionBeforeCreateEvent({
                    entry,
                    model,
                    input,
                    original: originalEntry
                })
            );

            // Delegate to repository
            const result = await this.repository.execute<T>(model, entry);

            if (result.isFail()) {
                await this.eventPublisher.publish(
                    new EntryRevisionCreateErrorEvent({
                        entry,
                        model,
                        input,
                        original: originalEntry,
                        error: result.error
                    })
                );
                return Result.fail(result.error);
            }

            const createdEntry = result.value;

            // Publish after event
            await this.eventPublisher.publish(
                new EntryRevisionAfterCreateEvent({
                    entry: createdEntry,
                    model,
                    input,
                    original: originalEntry
                })
            );

            return Result.ok(createdEntry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryRevisionCreateErrorEvent({
                    entry,
                    model,
                    input,
                    original: originalEntry,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const CreateEntryRevisionFromUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateEntryRevisionFromUseCaseImpl,
    dependencies: [
        CreateEntryRevisionFromRepository,
        AccessControl,
        GetRevisionByIdUseCase,
        GetLatestRevisionByEntryIdUseCase,
        IdentityContext,
        TenantContext,
        EventPublisher,
        CmsContext
    ]
});
