import { createImplementation } from "@webiny/feature/api";
import { ListPublishedEntriesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListEntriesUseCase } from "./abstractions.js";
import type { CmsEntryListParams, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * ListPublishedEntriesUseCase - Lists published entries for read API.
 * Delegates to base ListEntriesUseCase with published: true filter.
 */
class ListPublishedEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private listEntriesUseCase: ListEntriesUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): UseCaseAbstraction.Return<T> {
        const { where, ...rest } = params || {};

        // Add published: true filter
        return await this.listEntriesUseCase.execute<T>(model, {
            ...rest,
            where: {
                ...where,
                published: true,
                wbyDeleted_not: true
            }
        });
    }
}

export const ListPublishedEntriesUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListPublishedEntriesUseCaseImpl,
    dependencies: [ListEntriesUseCase]
});
