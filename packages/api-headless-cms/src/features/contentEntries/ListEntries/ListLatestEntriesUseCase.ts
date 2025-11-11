import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { ListLatestEntriesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListEntriesUseCase } from "./abstractions.js";
import type {
    CmsEntry,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsEntryValues,
    CmsModel
} from "~/types/index.js";

/**
 * Lists latest entries for manage API (non-deleted).
 */
class ListLatestEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private listEntriesUseCase: ListEntriesUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<Result<[CmsEntry<T>[], CmsEntryMeta], UseCaseAbstraction.Error>> {
        const { where, ...rest } = params || {};

        return await this.listEntriesUseCase.execute<T>(model, {
            ...rest,
            where: {
                ...where,
                latest: true,
                wbyDeleted_not: true
            }
        });
    }
}

export const ListLatestEntriesUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListLatestEntriesUseCaseImpl,
    dependencies: [ListEntriesUseCase]
});
