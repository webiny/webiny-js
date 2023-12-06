import { BulkAction, BulkActionConfig } from "./BulkAction";
import { FolderAction, FolderActionConfig } from "./FolderAction";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    folderActions: FolderActionConfig[];
}

export const Browser = {
    BulkAction,
    FolderAction
};
