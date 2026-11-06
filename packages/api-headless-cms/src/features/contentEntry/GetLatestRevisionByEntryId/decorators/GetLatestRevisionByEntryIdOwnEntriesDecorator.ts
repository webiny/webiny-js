import { createDecorator, Result } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdBaseUseCase } from "../abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { isSingletonModel } from "~/features/contentEntry/shared/isSingletonModel.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetLatestRevisionParams
} from "~/types/index.js";

/**
 * GetLatestRevisionByEntryIdOwnEntriesDecorator - Fails with EntryNotAuthorizedError when the identity may
 * access only its own entries and the loaded entry belongs to someone else.
 * Singleton models are exempt.
 */
class GetLatestRevisionByEntryIdOwnEntriesDecoratorImpl
    implements GetLatestRevisionByEntryIdBaseUseCase.Interface
{
    public constructor(
        private accessControl: AccessControl.Interface,
        private decoratee: GetLatestRevisionByEntryIdBaseUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ): Promise<Result<CmsEntry<T>, GetLatestRevisionByEntryIdBaseUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, params);

        if (result.isFail()) {
            return result;
        }

        const entry = result.value;

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

export const GetLatestRevisionByEntryIdOwnEntriesDecorator = createDecorator({
    abstraction: GetLatestRevisionByEntryIdBaseUseCase,
    decorator: GetLatestRevisionByEntryIdOwnEntriesDecoratorImpl,
    dependencies: [AccessControl]
});
