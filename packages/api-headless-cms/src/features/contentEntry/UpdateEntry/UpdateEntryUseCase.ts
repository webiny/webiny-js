import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { UpdateEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateEntryRepository } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { EntryBeforeUpdateEvent, EntryAfterUpdateEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/abstractions.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryLockedError } from "~/domain/contentEntry/errors.js";
import { createUpdateEntryData } from "~/crud/contentEntry/entryDataFactories/createUpdateEntryData.js";

/**
 * UpdateEntryUseCase - Orchestrates entry updates.
 *
 * Responsibilities:
 * - Fetch original entry
 * - Validate entry is not locked
 * - Transform raw input to updated domain entry
 * - Apply access control
 * - Publish domain events
 * - Delegate persistence to repository
 */
class UpdateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private cmsContext: CmsContext.Interface,
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private getRevisionByIdUseCase: GetRevisionByIdUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        rawInput: UpdateCmsEntryInput<T>,
        metaInput?: GenericRecord,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        // Check initial access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        try {
            const result = await this.getRevisionByIdUseCase.execute<T>(model, id);

            if (result.isFail()) {
                return Result.fail(result.error);
            }

            const originalEntry = result.value;

            // Check if entry is locked
            if (originalEntry.locked) {
                return Result.fail(new EntryLockedError());
            }

            // Transform raw input to updated domain entry
            const { entry, input } = await createUpdateEntryData<T>({
                model,
                rawInput,
                options,
                context: this.cmsContext,
                getIdentity: () => this.identityContext.getIdentity(),
                getTenant: () => this.tenantContext.getTenant(),
                originalEntry,
                metaInput
            });

            // Apply access control on the updated entry
            const canAccessEntry = await this.accessControl.canAccessEntry({
                model,
                entry,
                rwd: "w"
            });

            if (!canAccessEntry) {
                return Result.fail(EntryNotAuthorizedError.fromModel(model));
            }

            // Publish before event
            await this.eventPublisher.publish(
                new EntryBeforeUpdateEvent({ entry, original: originalEntry, input, model })
            );

            // Persist updated entry
            const updateResult = await this.repository.execute(model, entry);
            if (updateResult.isFail()) {
                return Result.fail(updateResult.error);
            }

            // Publish after event
            await this.eventPublisher.publish(
                new EntryAfterUpdateEvent({
                    entry,
                    original: originalEntry,
                    input,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            // Handle errors from createUpdateEntryData or other operations
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const UpdateEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: UpdateEntryUseCaseImpl,
    dependencies: [
        EventPublisher,
        UpdateEntryRepository,
        AccessControl,
        CmsContext,
        TenantContext,
        IdentityContext,
        GetRevisionByIdUseCase
    ]
});
