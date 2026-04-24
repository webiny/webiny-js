import { createDecorator } from "@webiny/feature/api";
import { GetEntriesByIdsUseCase } from "../abstractions.js";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * GetEntriesByIdsNotDeletedDecorator - Filters out deleted entries.
 *
 * This decorator wraps the GetEntriesByIdsUseCase and filters out
 * entries marked as deleted (wbyDeleted flag).
 */
class GetEntriesByIdsNotDeletedDecoratorImpl implements GetEntriesByIdsUseCase.Interface {
    public constructor(private decoratee: GetEntriesByIdsUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], GetEntriesByIdsUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, ids);

        if (result.isFail()) {
            return result;
        }

        const entries = result.value;

        // Filter out deleted entries
        const nonDeletedEntries = entries.filter(entry => !entry.wbyDeleted);

        return Result.ok(nonDeletedEntries);
    }
}

export const GetEntriesByIdsNotDeletedDecorator = createDecorator({
    abstraction: GetEntriesByIdsUseCase,
    decorator: GetEntriesByIdsNotDeletedDecoratorImpl,
    dependencies: []
});
