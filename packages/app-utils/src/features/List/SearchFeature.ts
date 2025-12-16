import {
    SearchFeature as Abstraction,
    type ISearchFeature,
    ListQueryParamsRepository,
    type BaseListParams
} from "./abstractions.js";

class SearchFeatureImpl<TParams extends BaseListParams> implements ISearchFeature {
    constructor(private queryParams: ListQueryParamsRepository.Interface<TParams>) {}

    async setSearch(query: string): Promise<void> {
        await this.queryParams.set(params => {
            params.search = query;
        });
    }
}

export const SearchFeature = Abstraction.createImplementation({
    implementation: SearchFeatureImpl,
    dependencies: [ListQueryParamsRepository]
});
