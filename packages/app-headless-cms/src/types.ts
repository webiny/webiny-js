import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { FolderTableRow, RecordTableRow } from "@webiny/app-aco";

export type * from "@webiny/app-headless-cms-common/types/index.js";
export { isLayoutField } from "@webiny/app-headless-cms-common/types/index.js";

/***
 * ###### TABLE ########
 */
export type EntryTableItem = RecordTableRow<CmsContentEntry>;

export type TableItem = FolderTableRow | EntryTableItem;

export interface FieldLayoutPosition {
    row: number;
    index: number | null;
}
