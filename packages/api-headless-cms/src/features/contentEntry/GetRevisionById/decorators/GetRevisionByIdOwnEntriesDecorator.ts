import { createDecorator, Result } from "@webiny/feature/api";
import { GetRevisionByIdUseCase } from "../abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { isSingletonModel } from "~/features/contentEntry/shared/isSingletonModel.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * GetRevisionByIdOwnEntriesDecorator - Fails with EntryNotAuthorizedError when the identity may
 * access only its own entries and the loaded entry belongs to someone else.
 * Singleton models are exempt.
 */
class GetRevisionByIdOwnEntriesDecoratorImpl implements GetRevisionByIdUseCase.Interface {
    public constructor(
        private accessControl: AccessControl.Interface,
        private decoratee: GetRevisionByIdUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, GetRevisionByIdUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, id);

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

export const GetRevisionByIdOwnEntriesDecorator = createDecorator({
    abstraction: GetRevisionByIdUseCase,
    decorator: GetRevisionByIdOwnEntriesDecoratorImpl,
    dependencies: [AccessControl]
});
