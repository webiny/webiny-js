import type { OnDataTableSortingChange } from "@webiny/admin-ui";

export interface ISortItemsController {
    execute: OnDataTableSortingChange;
}
