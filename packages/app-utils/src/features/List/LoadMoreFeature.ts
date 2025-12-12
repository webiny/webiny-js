import {
    LoadMoreFeature as Abstraction,
    type ILoadMoreFeature,
    ListDataRepository,
    ListQueryParamsRepository,
    LoadingRepository,
    type BaseListParams
} from "./abstractions.js";

class LoadMoreFeatureImpl<TItem, TParams extends BaseListParams> implements ILoadMoreFeature {
    constructor(
        private repository: ListDataRepository.Interface<TItem, TParams>,
        private queryParams: ListQueryParamsRepository.Interface<TParams>,
        private loading: LoadingRepository.Interface
    ) {}

    async execute(): Promise<void> {
        if (!this.canLoadMore()) {
            return;
        }

        const params = this.queryParams.get();

        await this.loading.runCallback(this.repository.append(params), "loadMore");
    }

    private canLoadMore(): boolean {
        // Don't allow load more if already loading
        if (this.loading.isLoading("loadMore")) {
            return false;
        }

        // Check if repository has more items
        return this.repository.hasMore();
    }
}

export const LoadMoreFeature = Abstraction.createImplementation({
    implementation: LoadMoreFeatureImpl,
    dependencies: [ListDataRepository, ListQueryParamsRepository, LoadingRepository]
});
