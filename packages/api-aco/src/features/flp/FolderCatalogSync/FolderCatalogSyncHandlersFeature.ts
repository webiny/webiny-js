import { createFeature } from "@webiny/feature/api";
import {
    SyncFolderCatalogOnFolderCreated,
    SyncFolderCatalogOnFolderDeleted,
    SyncFolderCatalogOnFolderUpdated
} from "./handlers.js";

/**
 * Forwards folder changes to `FolderCatalogSync`. The implementation of `FolderCatalogSync` comes
 * from the storage's FLP strategy.
 */
export const FolderCatalogSyncHandlersFeature = createFeature({
    name: "Aco/FolderCatalogSyncHandlers",
    register(container) {
        container.register(SyncFolderCatalogOnFolderCreated);
        container.register(SyncFolderCatalogOnFolderUpdated);
        container.register(SyncFolderCatalogOnFolderDeleted);
    }
});
