import { createDecorator, Result } from "@webiny/feature/api";
import { GetPreviousRevisionByEntryIdBaseUseCase } from "../abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { isSingletonModel } from "~/features/contentEntry/shared/isSingletonModel.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetPreviousRevisionParams
} from "~/types/index.js";

/**
 * GetPreviousRevisionByEntryIdOwnEntriesDecorator - Fails with EntryNotAuthorizedError when the identity may
 * access only its own entries and the loaded entry belongs to someone else.
 * Singleton models are exempt.
 */
class GetPreviousRevisionByEntryIdOwnEntriesDecoratorImpl
    implements GetPreviousRevisionByEntryIdBaseUseCase.Interface
{
    public constructor(
        private accessControl: AccessControl.Interface,
        private decoratee: GetPreviousRevisionByEntryIdBaseUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ): Promise<Result<CmsEntry<T>, GetPreviousRevisionByEntryIdBaseUseCase.Error>> {
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

export const GetPreviousRevisionByEntryIdOwnEntriesDecorator = createDecorator({
    abstraction: GetPreviousRevisionByEntryIdBaseUseCase,
    decorator: GetPreviousRevisionByEntryIdOwnEntriesDecoratorImpl,
    dependencies: [AccessControl]
});
