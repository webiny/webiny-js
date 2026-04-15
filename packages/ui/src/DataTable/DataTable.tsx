import React from "react";
import type {
    DataTableColumn,
    DataTableColumns,
    DataTableColumnSort,
    DataTableColumnVisibility,
    DataTableDefaultData,
    DataTableProps as AdminDataTableProps,
    DataTableRow,
    DataTableSorting,
    OnDataTableColumnVisibilityChange,
    OnDataTableSortingChange
} from "@webiny/admin-ui";
import { DataTable as AdminDataTable } from "@webiny/admin-ui";

/**
 * @deprecated @webiny/ui package is deprecated and will be removed in future releases.
 * Please check `DataTable` types from the `@webiny/admin-ui` package instead.
 */
type Column<T> = DataTableColumn<T>;
/**
 * @deprecated @webiny/ui package is deprecated and will be removed in future releases.
 * Please check `DataTable` types from the `@webiny/admin-ui` package instead.
 */
type ColumnSort = DataTableColumnSort;
/**
 * @deprecated @webiny/ui package is deprecated and will be removed in future releases.
 * Please check `DataTable` types from the `@webiny/admin-ui` package instead.
 */
type ColumnVisibility = DataTableColumnVisibility;
/**
 * @deprecated @webiny/ui package is deprecated and will be removed in future releases.
 * Please check `DataTable` types from the `@webiny/admin-ui` package instead.
 */
type Columns<T> = DataTableColumns<T>;
/**
 * @deprecated @webiny/ui package is deprecated and will be removed in future releases.
 * Please check `DataTable` types from the `@webiny/admin-ui` package instead.
 */
type DefaultData = DataTableDefaultData;
/**
 * @deprecated @webiny/ui package is deprecated and will be removed in future releases.
 * Please check `DataTable` types from the `@webiny/admin-ui` package instead.
 */
type OnColumnVisibilityChange = OnDataTableColumnVisibilityChange;
/**
 * @deprecated @webiny/ui package is deprecated and will be removed in future releases.
 * Please check `DataTable` types from the `@webiny/admin-ui` package instead.
 */
type OnSortingChange = OnDataTableSortingChange;
/**
 * @deprecated @webiny/ui package is deprecated and will be removed in future releases.
 * Please check `DataTable` types from the `@webiny/admin-ui` package instead.
 */
type Sorting = DataTableSorting;
/**
 * @deprecated @webiny/ui package is deprecated and will be removed in future releases.
 * Please check `DataTable` types from the `@webiny/admin-ui` package instead.
 */
type TableRow<T> = DataTableRow<T>;

interface DataTableProps<TEntry>
    extends Omit<AdminDataTableProps<TEntry>, "loading" | "stickyHeader"> {
    loadingInitial?: AdminDataTableProps<TEntry>["loading"];
    stickyRows?: number;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `DataTable` component from the `@webiny/admin-ui` package instead.
 */
const DataTable = <T extends Record<string, any> & DataTableDefaultData>({
    loadingInitial,
    stickyRows,
    ...props
}: DataTableProps<T>) => {
    return <AdminDataTable {...props} loading={loadingInitial} stickyHeader={!!stickyRows} />;
};

export {
    DataTable,
    type Column,
    type ColumnSort,
    type ColumnVisibility,
    type Columns,
    type DefaultData,
    type OnColumnVisibilityChange,
    type OnSortingChange,
    type Sorting,
    type TableRow
};
