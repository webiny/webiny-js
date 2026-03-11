import type { OnSortingChange } from "@webiny/ui/DataTable/index.js";

export interface ISortItemsController {
    execute: OnSortingChange;
}
