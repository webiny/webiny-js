import { createDecorator } from "@webiny/feature/api";
import { GetPublishedEntriesByIdsUseCase } from "../abstractions.js";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * GetPublishedEntriesByIdsNotDeletedDecorator - Filters out deleted entries.
 *
 * This decorator wraps the GetPublishedEntriesByIdsUseCase and filters out
 * entries marked as deleted (wbyDeleted flag).
 */
class GetPublishedEntriesByIdsNotDeletedDecoratorImpl
    implements GetPublishedEntriesByIdsUseCase.Interface
{
    public constructor(private decoratee: GetPublishedEntriesByIdsUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], GetPublishedEntriesByIdsUseCase.Error>> {
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

export const GetPublishedEntriesByIdsNotDeletedDecorator = createDecorator({
    abstraction: GetPublishedEntriesByIdsUseCase,
    decorator: GetPublishedEntriesByIdsNotDeletedDecoratorImpl,
    dependencies: []
});
