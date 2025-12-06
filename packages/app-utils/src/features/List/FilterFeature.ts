import {
    FilterFeature as Abstraction,
    type IFilterFeature,
    ListQueryParamsRepository,
    type BaseListParams
} from "./abstractions.js";

class FilterFeatureImpl<TParams extends BaseListParams> implements IFilterFeature {
    constructor(private queryParams: ListQueryParamsRepository.Interface<TParams>) {}

    async setFilter(key: string, value: unknown): Promise<void> {
        await this.queryParams.set(params => {
            if (!params.filters) {
                params.filters = {};
            }
            params.filters[key] = value;
        });
    }

    async clearAllFilters(): Promise<void> {
        await this.queryParams.set(params => {
            params.filters = {};
        });
    }
}

export const FilterFeature = Abstraction.createImplementation({
    implementation: FilterFeatureImpl,
    dependencies: [ListQueryParamsRepository]
});
