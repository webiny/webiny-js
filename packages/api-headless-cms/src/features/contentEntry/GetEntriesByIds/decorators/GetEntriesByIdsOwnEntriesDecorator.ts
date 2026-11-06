import { createDecorator, Result } from "@webiny/feature/api";
import { GetEntriesByIdsUseCase } from "../abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { isSingletonModel } from "~/features/contentEntry/shared/isSingletonModel.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * GetEntriesByIdsOwnEntriesDecorator - Drops entries the identity does not own when it may
 * access only its own entries. Singleton models are exempt.
 */
class GetEntriesByIdsOwnEntriesDecoratorImpl implements GetEntriesByIdsUseCase.Interface {
    public constructor(
        private accessControl: AccessControl.Interface,
        private decoratee: GetEntriesByIdsUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], GetEntriesByIdsUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, ids);

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

export const GetEntriesByIdsOwnEntriesDecorator = createDecorator({
    abstraction: GetEntriesByIdsUseCase,
    decorator: GetEntriesByIdsOwnEntriesDecoratorImpl,
    dependencies: [AccessControl]
});
