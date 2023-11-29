import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";
import { FolderTableItem, RecordTableItem } from "@webiny/app-aco/types";

export * from "@webiny/app-headless-cms-common/types";

/***
 * ###### TABLE ########
 */
export type EntryTableItem = CmsContentEntry & RecordTableItem;

export type TableItem = FolderTableItem | EntryTableItem;
