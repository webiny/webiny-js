import { createDecorator, Result } from "@webiny/feature/api";
import { GetRevisionsByEntryIdUseCase } from "../abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { isSingletonModel } from "~/features/contentEntry/shared/isSingletonModel.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * GetRevisionsByEntryIdOwnEntriesDecorator - Drops entries the identity does not own when it may
 * access only its own entries. Singleton models are exempt.
 */
class GetRevisionsByEntryIdOwnEntriesDecoratorImpl
    implements GetRevisionsByEntryIdUseCase.Interface
{
    public constructor(
        private accessControl: AccessControl.Interface,
        private decoratee: GetRevisionsByEntryIdUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T>[], GetRevisionsByEntryIdUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, entryId);

        if (result.isFail()) {
            return result;
        }

        if (isSingletonModel(model)) {
            return result;
        }

        const onlyOwned = await this.accessControl.canAccessOnlyOwnedEntries({ model });
        if (!onlyOwned) {
            return result;
        }

        const entries: CmsEntry<T>[] = [];
        for (const entry of result.value) {
            // oxlint-disable-next-line no-await-in-loop -- in memory: the permissions and identity are already loaded.
            if (await this.accessControl.canAccessEntry({ model, entry })) {
                entries.push(entry);
            }
        }

        return Result.ok(entries);
    }
}

export const GetRevisionsByEntryIdOwnEntriesDecorator = createDecorator({
    abstraction: GetRevisionsByEntryIdUseCase,
    decorator: GetRevisionsByEntryIdOwnEntriesDecoratorImpl,
    dependencies: [AccessControl]
});
