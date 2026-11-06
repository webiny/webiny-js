import { createDecorator, Result } from "@webiny/feature/api";
import { GetPublishedRevisionByEntryIdUseCase } from "../abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { isSingletonModel } from "~/features/contentEntry/shared/isSingletonModel.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * GetPublishedRevisionByEntryIdOwnEntriesDecorator - Fails with EntryNotAuthorizedError when the identity may
 * access only its own entries and the loaded entry belongs to someone else.
 * Singleton models are exempt.
 */
class GetPublishedRevisionByEntryIdOwnEntriesDecoratorImpl
    implements GetPublishedRevisionByEntryIdUseCase.Interface
{
    public constructor(
        private accessControl: AccessControl.Interface,
        private decoratee: GetPublishedRevisionByEntryIdUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T> | null, GetPublishedRevisionByEntryIdUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, entryId);

        if (result.isFail()) {
            return result;
        }

        const entry = result.value;
        if (!entry) {
            return result;
        }

        if (isSingletonModel(model)) {
            return result;
        }

        const onlyOwned = await this.accessControl.canAccessOnlyOwnedEntries({ model });
        if (!onlyOwned) {
            return result;
        }

        const canAccessEntry = await this.accessControl.canAccessEntry({ model, entry });
        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromEntry(entry));
        }

        return result;
    }
}

export const GetPublishedRevisionByEntryIdOwnEntriesDecorator = createDecorator({
    abstraction: GetPublishedRevisionByEntryIdUseCase,
    decorator: GetPublishedRevisionByEntryIdOwnEntriesDecoratorImpl,
    dependencies: [AccessControl]
});
