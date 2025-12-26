import { createImplementation } from "@webiny/feature/api";
import { ListDeletedEntriesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListEntriesUseCase } from "./abstractions.js";
import type { CmsEntryListParams, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * ListDeletedEntriesUseCase - Lists deleted entries for manage API.
 * Delegates to base ListEntriesUseCase with latest: true and wbyDeleted: true filters.
 */
class ListDeletedEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private listEntriesUseCase: ListEntriesUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): UseCaseAbstraction.Return<T> {
        const { where, ...rest } = params || {};

        // Add latest: true and wbyDeleted: true filters
        return await this.listEntriesUseCase.execute<T>(model, {
            ...rest,
            where: {
                ...where,
                latest: true,
                wbyDeleted: true
            }
        });
    }
}

export const ListDeletedEntriesUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListDeletedEntriesUseCaseImpl,
    dependencies: [ListEntriesUseCase]
});
