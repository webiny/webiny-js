import { createImplementation, Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    CreateEntryRevisionFromRepository,
    CreateEntryRevisionFromUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
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
import { CreateEntryRevisionFromDataFactory } from "~/features/contentEntry/entryDataFactories/CreateEntryRevisionFromDataFactory/index.js";

class CreateEntryRevisionFromUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: CreateEntryRevisionFromRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private createEntryRevisionFromDataFactory: CreateEntryRevisionFromDataFactory.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        sourceId: string,
        rawInput: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const { id: uniqueId } = parseIdentifier(sourceId);
        const originalResult = await this.getRevisionById.execute<T>(model, sourceId);

        if (originalResult.isFail()) {
            return Result.fail(originalResult.error);
        }

        const originalEntry = originalResult.value;

        const latestResult = await this.getLatestRevision.execute<T>(model, { id: uniqueId });

        if (latestResult.isFail()) {
            return Result.fail(latestResult.error);
        }

        const latestStorageEntry = latestResult.value;

        const { entry, input } = await this.createEntryRevisionFromDataFactory.create<T>(
            sourceId,
            model,
            rawInput,
            originalEntry,
            latestStorageEntry,
            options
        );

        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry,
            rwd: "w"
        });

        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        try {
            await this.eventPublisher.publish(
                new EntryRevisionBeforeCreateEvent({
                    entry,
                    model,
                    input,
                    original: originalEntry
                })
            );

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
        EventPublisher,
        CreateEntryRevisionFromDataFactory
    ]
});
