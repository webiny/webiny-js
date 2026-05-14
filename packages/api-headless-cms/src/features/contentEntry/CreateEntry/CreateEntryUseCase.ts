import { createImplementation, Result } from "@webiny/feature/api";
import { CreateEntryRepository, CreateEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { EntryAfterCreateEvent, EntryBeforeCreateEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import { EntryNotAuthorizedError, EntryValidationError } from "~/domain/contentEntry/errors.js";
import { CreateEntryDataFactory } from "~/features/contentEntry/entryDataFactories/CreateEntryDataFactory/index.js";

class CreateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: CreateEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private createEntryDataFactory: CreateEntryDataFactory.Interface
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
            if (error.code === "VALIDATION_FAILED") {
                return Result.fail(new EntryValidationError(error.message, error.data));
            }
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const CreateEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateEntryUseCaseImpl,
    dependencies: [EventPublisher, CreateEntryRepository, AccessControl, CreateEntryDataFactory]
});
