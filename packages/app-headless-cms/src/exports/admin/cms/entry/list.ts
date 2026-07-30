export { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";
export { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
export { TableRowMapper } from "~/presentation/contentEntries/views/Table/abstractions.js";
export { ListEntriesGraphQLFieldSelection } from "~/features/contentEntry/listEntries/abstractions.js";
export type { IListEntriesGraphQLFieldSelection } from "~/features/contentEntry/listEntries/abstractions.js";
export { GetEntryGraphQLFieldSelection } from "~/features/contentEntry/getEntry/abstractions.js";
export type { IGetEntryGraphQLFieldSelection } from "~/features/contentEntry/getEntry/abstractions.js";

// Bulk action trigger — resolves the BulkActionUseCase used to run a (built-in or
// custom) entries bulk action from the Admin UI. Pair with a custom EntriesBulkAction
// on the API side (webiny/api/cms/entry).
export { BulkActionFeature } from "~/features/contentEntry/bulkAction/feature.js";
export { BulkActionUseCase } from "~/features/contentEntry/bulkAction/abstractions.js";

// Code-based ("headless") bulk actions. Implement `CmsBulkAction` and register it with
// `CmsBulkAction.createImplementation({ implementation, dependencies })` + `<RegisterFeature>`;
// the framework generates the toolbar button and websocket notification handlers.
export { CmsBulkAction } from "~/features/contentEntry/bulkAction/CmsBulkAction/index.js";
export type {
    ICmsBulkAction,
    BulkActionCtx,
    ConfirmSpec,
    NotificationSpec
} from "~/features/contentEntry/bulkAction/CmsBulkAction/index.js";
