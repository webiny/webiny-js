import { createImplementation, Result } from "@webiny/feature/api";
import { CreateEntryRepository, CreateEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { EntryEventPublisher } from "~/features/contentEntry/EntryEventPublisher/index.js";
import { EntryAfterCreateEvent, EntryBeforeCreateEvent } from "./events.js";
import { AccessControl, StorageOperations } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import { EntryAlreadyExistsError, EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { CreateEntryDataFactory } from "~/features/contentEntry/entryDataFactories/CreateEntryDataFactory/index.js";

class CreateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EntryEventPublisher.Interface,
        private repository: CreateEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private createEntryDataFactory: CreateEntryDataFactory.Interface,
        private storageOperations: StorageOperations.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        try {
            const { entry, input } = await this.createEntryDataFactory.create<T>(
                model,
                rawInput,
                options
            );

            const canAccessEntry = await this.accessControl.canAccessEntry({
                model,
                entry,
                rwd: "w"
            });

            if (!canAccessEntry) {
                return Result.fail(EntryNotAuthorizedError.fromEntry(entry));
            }

            if (await this.isTakenEntryId(model, rawInput, entry.entryId, options)) {
                return Result.fail(new EntryAlreadyExistsError(entry.entryId));
            }

            await this.eventPublisher.publish(new EntryBeforeCreateEvent({ entry, input, model }));

            const result = await this.repository.execute(model, entry);
            if (result.isFail()) {
                return Result.fail(result.error);
            }

            await this.eventPublisher.publish(
                new EntryAfterCreateEvent({
                    entry,
                    input,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }

    /**
     * A caller-provided id must not point at an existing entry: storage writes the new revision
     * over it, and the caller would take over someone else's entry. Deleted entries count too.
     * Code running without authorization (imports, internal records that are re-created on
     * purpose) is left alone, and so are private models unless the caller opts in.
     */
    private async isTakenEntryId(
        model: CmsModel,
        rawInput: CreateCmsEntryInput,
        entryId: string,
        options?: CreateCmsEntryOptionsInput
    ): Promise<boolean> {
        if (!rawInput.id || !this.identityContext.isAuthorizationEnabled()) {
            return false;
        }
        if (model.isPrivate && !options?.failIfExists) {
            return false;
        }
        const existing = await this.storageOperations.entries.getLatestRevisionByEntryId(model, {
            id: entryId
        });
        return !!existing;
    }
}

export const CreateEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateEntryUseCaseImpl,
    dependencies: [
        EntryEventPublisher,
        CreateEntryRepository,
        AccessControl,
        CreateEntryDataFactory,
        StorageOperations,
        IdentityContext
    ]
});
