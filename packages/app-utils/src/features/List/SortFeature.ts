import {
    SortFeature as Abstraction,
    type ISortFeature,
    ListQueryParamsRepository,
    type BaseListParams
} from "./abstractions.js";

class SortFeatureImpl<TParams extends BaseListParams> implements ISortFeature {
    constructor(private queryParams: ListQueryParamsRepository.Interface<TParams>) {}

    async setSort(by: string, dir: "asc" | "desc"): Promise<void> {
        await this.queryParams.set(params => {
            params.sort = { by, dir };
        });
    }
}

export const SortFeature = Abstraction.createImplementation({
    implementation: SortFeatureImpl,
    dependencies: [ListQueryParamsRepository]
});
