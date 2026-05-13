import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { parseIdentifier } from "@webiny/utils";
import { UnpublishEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UnpublishEntryRepository } from "./abstractions.js";
import { EntryBeforeUnpublishEvent } from "./events.js";
import { EntryAfterUnpublishEvent } from "./events.js";
import { EntryUnpublishErrorEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetPublishedRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
import type { CmsEntry, CmsEntryValues } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { EntryValidationError } from "~/domain/contentEntry/errors.js";
import { CreateUnpublishEntryDataFactory } from "~/features/contentEntry/entryDataFactories/CreateUnpublishEntryDataFactory/index.js";

class UnpublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: UnpublishEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getPublishedRevisionByEntryId: GetPublishedRevisionByEntryIdUseCase.Interface,
        private createUnpublishEntryDataFactory: CreateUnpublishEntryDataFactory.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, pw: "u" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const { id: entryId } = parseIdentifier(id);

        const publishedResult = await this.getPublishedRevisionByEntryId.execute<T>(model, entryId);

        if (publishedResult.isFail()) {
            return Result.fail(publishedResult.error);
        }

        const originalEntry = publishedResult.value;

        if (!originalEntry) {
            return Result.fail(new EntryNotFoundError(id));
        }

        if (originalEntry.id !== id) {
            return Result.fail(new EntryValidationError(`Entry is not published!`));
        }

        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry: originalEntry,
            pw: "u"
        });

        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const { entry } = await this.createUnpublishEntryDataFactory.create<T>(originalEntry);

        try {
            await this.eventPublisher.publish(new EntryBeforeUnpublishEvent({ entry, model }));

            const unpublishResult = await this.repository.execute<T>(model, entry);
            if (unpublishResult.isFail()) {
                await this.eventPublisher.publish(
                    new EntryUnpublishErrorEvent({ entry, model, error: unpublishResult.error })
                );
                return Result.fail(unpublishResult.error);
            }

            const storageEntry = unpublishResult.value;

            await this.eventPublisher.publish(
                new EntryAfterUnpublishEvent({
                    entry,
                    storageEntry,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryUnpublishErrorEvent({ entry, model, error: error as Error })
            );
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const UnpublishEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: UnpublishEntryUseCaseImpl,
    dependencies: [
        EventPublisher,
        UnpublishEntryRepository,
        AccessControl,
        GetPublishedRevisionByEntryIdUseCase,
        CreateUnpublishEntryDataFactory
    ]
});
