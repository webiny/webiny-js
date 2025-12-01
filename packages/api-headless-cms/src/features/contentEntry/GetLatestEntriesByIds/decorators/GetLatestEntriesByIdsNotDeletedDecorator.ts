import { createDecorator } from "@webiny/feature/api";
import { GetLatestEntriesByIdsUseCase } from "../abstractions.js";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * GetLatestEntriesByIdsNotDeletedDecorator - Filters out deleted entries.
 *
 * This decorator wraps the GetLatestEntriesByIdsUseCase and filters out
 * entries marked as deleted (wbyDeleted flag).
 */
class GetLatestEntriesByIdsNotDeletedDecoratorImpl
    implements GetLatestEntriesByIdsUseCase.Interface
{
    constructor(private decoratee: GetLatestEntriesByIdsUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], GetLatestEntriesByIdsUseCase.Error>> {
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

export const GetLatestEntriesByIdsNotDeletedDecorator = createDecorator({
    abstraction: GetLatestEntriesByIdsUseCase,
    decorator: GetLatestEntriesByIdsNotDeletedDecoratorImpl,
    dependencies: []
});
