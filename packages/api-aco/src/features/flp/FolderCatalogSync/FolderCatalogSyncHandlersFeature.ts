import { createFeature } from "@webiny/feature/api";
import SyncFolderCatalogOnFolderCreatedHandler from "./SyncFolderCatalogOnFolderCreatedHandler.js";
import SyncFolderCatalogOnFolderUpdatedHandler from "./SyncFolderCatalogOnFolderUpdatedHandler.js";
import SyncFolderCatalogOnFolderDeletedHandler from "./SyncFolderCatalogOnFolderDeletedHandler.js";

/**
 * Forwards folder changes to `FolderCatalogSync`. The implementation of `FolderCatalogSync` comes
 * from the storage's FLP strategy.
 */
export const FolderCatalogSyncHandlersFeature = createFeature({
    name: "Aco/FolderCatalogSyncHandlers",
    register(container) {
        container.register(SyncFolderCatalogOnFolderCreatedHandler);
        container.register(SyncFolderCatalogOnFolderUpdatedHandler);
        container.register(SyncFolderCatalogOnFolderDeletedHandler);
    }
});
