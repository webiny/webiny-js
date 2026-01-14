import { createImplementation, Result } from "@webiny/feature/api";
import { CreateEntryRepository, CreateEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { EntryAfterCreateEvent, EntryBeforeCreateEvent } from "./events.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import { EntryNotAuthorizedError, EntryValidationError } from "~/domain/contentEntry/errors.js";
import { createEntryData } from "~/crud/contentEntry/entryDataFactories/createEntryData.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";

/**
 * CreateEntryUseCase - Orchestrates entry creation.
 *
 * Responsibilities:
 * - Transform raw input to domain entry
 * - Apply access control
 * - Publish domain events
 * - Delegate persistence to repository
 */
class CreateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: CreateEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        // Check initial access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        try {
            // Transform raw input to domain entry
            const { entry, input } = await createEntryData<T>({
                model,
                rawInput,
                options,
                context: this.cmsContext,
                getIdentity: () => this.identityContext.getIdentity(),
                getTenant: () => this.tenantContext.getTenant(),
                accessControl: this.accessControl
            });

            // Apply access control on the created entry
            const canAccessEntry = await this.accessControl.canAccessEntry({
                model,
                entry,
                rwd: "w"
            });

            if (!canAccessEntry) {
                return Result.fail(EntryNotAuthorizedError.fromEntry(entry));
            }

            // Publish before event
            await this.eventPublisher.publish(new EntryBeforeCreateEvent({ entry, input, model }));

            // Persist entry
            const result = await this.repository.execute(model, entry);
            if (result.isFail()) {
                return Result.fail(result.error);
            }

            // Publish after event
            await this.eventPublisher.publish(
                new EntryAfterCreateEvent({
                    entry,
                    input,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            if (error.code === "VALIDATION_FAILED") {
                return Result.fail(new EntryValidationError(error.message, error.data));
            }
            // Handle errors from createEntryData or other operations
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const CreateEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateEntryUseCaseImpl,
    dependencies: [
        EventPublisher,
        CreateEntryRepository,
        AccessControl,
        TenantContext,
        IdentityContext,
        CmsContext
    ]
});
