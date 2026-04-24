import { createImplementation } from "@webiny/feature/api";
import { ListLatestEntriesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListEntriesUseCase } from "./abstractions.js";
import type { CmsEntryListParams, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * Lists latest entries for manage API (non-deleted).
 */
class ListLatestEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private listEntriesUseCase: ListEntriesUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): UseCaseAbstraction.Return<T> {
        const { where, ...rest } = params || {};

        return await this.listEntriesUseCase.execute<T>(model, {
            sort: ["createdOn_DESC"],
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
