// Feature.
export { ListPresenterFeature } from "./feature.js";

// Abstractions (types + DI tokens).
export { ListPresenter } from "./abstractions.js";
export type {
    IListPresenter,
    IListPresenterConfig,
    IListViewModel,
    IListActions,
    IListError,
    IDataSource,
    IDataSourceQuery,
    IDataSourceResult
} from "./abstractions.js";

export { QueryMatcher } from "./QueryMatcher.js";
export type { QueryMatcherConfig } from "./QueryMatcher.js";

export { FolderAwareDataSource } from "./FolderAwareDataSource.js";
export type {
    FolderAwareDataSourceConfig,
    FetchParams,
    FetchResult
} from "./FolderAwareDataSource.js";

export { SimpleDataSource } from "./SimpleDataSource.js";
