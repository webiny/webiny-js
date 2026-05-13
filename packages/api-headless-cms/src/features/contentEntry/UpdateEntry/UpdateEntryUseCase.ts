import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { UpdateEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateEntryRepository } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { EntryBeforeUpdateEvent, EntryAfterUpdateEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
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
import { UpdateEntryDataFactory } from "~/features/contentEntry/entryDataFactories/UpdateEntryDataFactory/index.js";

class UpdateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionByIdUseCase: GetRevisionByIdUseCase.Interface,
        private updateEntryDataFactory: UpdateEntryDataFactory.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        rawInput: UpdateCmsEntryInput<T>,
        metaInput?: GenericRecord,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
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

            if (originalEntry.locked) {
                return Result.fail(new EntryLockedError());
            }

            const { entry, input } = await this.updateEntryDataFactory.create<T>(
                model,
                rawInput,
                originalEntry,
                options,
                metaInput
            );

            const canAccessEntry = await this.accessControl.canAccessEntry({
                model,
                entry,
                rwd: "w"
            });

            if (!canAccessEntry) {
                return Result.fail(EntryNotAuthorizedError.fromModel(model));
            }

            await this.eventPublisher.publish(
                new EntryBeforeUpdateEvent({ entry, original: originalEntry, input, model })
            );

            const updateResult = await this.repository.execute(model, entry);
            if (updateResult.isFail()) {
                return Result.fail(updateResult.error);
            }

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
        GetRevisionByIdUseCase,
        UpdateEntryDataFactory
    ]
});
