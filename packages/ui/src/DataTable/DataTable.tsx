import React, { useMemo } from "react";

import { DataTableContent, DataTableCellProps } from "@rmwc/data-table";

import {
    getCoreRowModel,
    useReactTable,
    ColumnDef,
    getSortedRowModel,
    OnChangeFn,
    SortingState,
    RowSelectionState,
    Row,
    VisibilityState
} from "@tanstack/react-table";

import { Checkbox } from "~/Checkbox";
import { Skeleton } from "~/Skeleton";
import { TableHead } from "~/DataTable/TableHead";
import { TableBody } from "~/DataTable/TableBody";

import "@rmwc/data-table/data-table.css";
import { Table } from "./styled";

interface Column<T> {
    /*
     * Column header component.
     */
    header: string | number | JSX.Element;
    /*
     * Cell renderer, receives the full row and returns the value to render inside the cell.
     */
    cell?: (row: T) => string | number | JSX.Element | null;
    /*
     * Additional props to add to both header and row cells. Refer to RMWC documentation.
     */
    meta?: DataTableCellProps;
    /*
     * Column size.
     */
    size?: number;
    /*
     * Column class names.
     */
    className?: string;
    /*
     * Enable column sorting.
     */
    enableSorting?: boolean;
    /*
     * Enable column resizing.
     */
    enableResizing?: boolean;
    /*
     * Enable column visibility toggling.
     */
    enableHiding?: boolean;
}

export type Columns<T> = {
    [P in keyof T]?: Column<T>;
};

export type DefaultData = {
    id: string;
    /*
     * Define if a specific row can be selected.
     */
    selectable?: boolean;
};

export type Sorting = SortingState;

export type OnSortingChange = OnChangeFn<Sorting>;

export type OnColumnVisibilityChange = OnChangeFn<VisibilityState>;

interface Props<T> {
    /**
     * Show or hide borders.
     */
    bordered?: boolean;
    /**
     * Controls whether "select all" action is allowed.
     */
    canSelectAllRows?: boolean;
    /**
     * Columns definition.
     */
    columns: Columns<T>;
    /**
     * The column visibility state.
     */
    columnVisibility?: VisibilityState;
    /**
     * Callback that receives current column visibility state.
     */
    onColumnVisibilityChange?: OnColumnVisibilityChange;
    /**
     * Data to display into DataTable body.
     */
    data: T[];
    /**
     * Callback that is called to determine if the row is selectable.
     */
    isRowSelectable?: (row: Row<T>) => boolean;
    /**
     * Render the skeleton state at the initial data loading.
     */
    loadingInitial?: boolean;
    /**
     * Callback that receives the selected rows.
     */
    onSelectRow?: (rows: T[]) => void;
    /**
     * Callback that receives the toggled row.
     */
    onToggleRow?: (row: T) => void;
    /**
     * Callback that receives current sorting state.
     */
    onSortingChange?: OnSortingChange;
    /**
     * Selected rows.
     */
    selectedRows?: T[];
    /**
     * Sorting state.
     */
    sorting?: Sorting;
    /**
     * Initial sorting state.
     */
    initialSorting?: Sorting;
    /**
     * The number of columns to affix to the side of the table when scrolling.
     */
    stickyColumns?: number;
    /**
     * The number of rows to affix to the top of the table when scrolling.
     */
    stickyRows?: number;
}

interface DefineColumnsOptions<T> {
    canSelectAllRows: boolean;
    onSelectRow?: Props<T>["onSelectRow"];
    onToggleRow: Props<T>["onToggleRow"];
    loadingInitial: Props<T>["loadingInitial"];
}

const defineColumns = <T,>(
    columns: Props<T>["columns"],
    options: DefineColumnsOptions<T>
): ColumnDef<T>[] => {
    const { canSelectAllRows, onSelectRow, onToggleRow, loadingInitial } = options;

    return useMemo(() => {
        const columnsList = Object.keys(columns).map(key => ({
            id: key,
            ...columns[key as keyof typeof columns]
        }));

        const defaults: ColumnDef<T>[] = columnsList.map(column => {
            const {
                cell,
                className,
                enableHiding = true,
                enableResizing = true,
                enableSorting = false,
                header,
                id,
                meta,
                size = 200
            } = column;

            return {
                accessorKey: id,
                header: () => header,
                cell: info => {
                    if (cell && typeof cell === "function") {
                        return cell(info.row.original);
                    } else {
                        return info.getValue() || null;
                    }
                },
                enableSorting,
                meta: {
                    ...meta,
                    className
                },
                enableResizing,
                size,
                enableHiding
            };
        });

        const isSelectable = onToggleRow || onSelectRow;

        const select: ColumnDef<T>[] = isSelectable
            ? [
                  {
                      id: "datatable-select-column",
                      header: ({ table }) => {
                          if (!canSelectAllRows) {
                              return null;
                          }

                          return (
                              !loadingInitial && (
                                  <Checkbox
                                      indeterminate={table.getIsSomeRowsSelected()}
                                      value={table.getIsAllRowsSelected()}
                                      onChange={e => table.toggleAllPageRowsSelected(e)}
                                  />
                              )
                          );
                      },
                      cell: info => {
                          if (!info.row.getCanSelect()) {
                              return <></>;
                          }
                          return (
                              <Checkbox
                                  indeterminate={info.row.getIsSomeSelected()}
                                  value={info.row.getIsSelected()}
                                  onChange={info.row.getToggleSelectedHandler()}
                              />
                          );
                      },
                      meta: {
                          hasFormControl: true
                      },
                      enableSorting: false,
                      enableResizing: false,
                      enableHiding: false,
                      size: 56
                  }
              ]
            : [];

        return [...select, ...defaults].map(column => {
            if (loadingInitial) {
                return {
                    ...column,
                    cell: () => <Skeleton />
                };
            }

            return column;
        });
    }, [columns, onSelectRow, onToggleRow, loadingInitial]);
};

const defineData = <T,>(
    data: Props<T>["data"],
    loadingInitial: Props<T>["loadingInitial"]
): T[] => {
    if (loadingInitial) {
        return Array(10).fill({});
    }
    return data;
};

export const DataTable = <T extends Record<string, any> & DefaultData>({
    data,
    columns,
    onSelectRow,
    onToggleRow,
    loadingInitial,
    stickyColumns,
    stickyRows,
    bordered,
    sorting,
    onSortingChange,
    isRowSelectable,
    canSelectAllRows = true,
    selectedRows = [],
    initialSorting
}: Props<T>) => {
    const rowSelection = useMemo(() => {
        return selectedRows.reduce<RowSelectionState>((acc, item) => {
            const recordIndex = data.findIndex(rec => rec.id === item.id);
            return { ...acc, [recordIndex]: true };
        }, {});
    }, [selectedRows, data]);

    const onRowSelectionChange: OnChangeFn<RowSelectionState> = updater => {
        const newSelection = typeof updater === "function" ? updater(rowSelection) : updater;

        /**
         * `@tanstack/react-table` isn't telling us what row was selected or deselected. It simply gives us
         * the new selection state (an object with row indexes that are currently selected).
         *
         * To figure out what row was toggled, we need to calculate the difference between the old selection
         * and the new selection. What we're doing here is:
         * - find all items that were present in the previous selection, but are no longer present in the new selection
         * - find all items that are present in the new selection, but were not present in the previous selection
         */
        const toggledRows = [
            ...Object.keys(rowSelection).filter(x => !(x in newSelection)),
            ...Object.keys(newSelection).filter(x => !(x in rowSelection))
        ];

        // If the difference is only 1 item, and `onToggleRow` is available, execute that.
        if (toggledRows.length === 1 && typeof onToggleRow === "function") {
            onToggleRow(data[parseInt(toggledRows[0])]);
            return;
        } else if (typeof onSelectRow === "function") {
            const selection = Object.keys(newSelection).map(key => data[parseInt(key)]);
            onSelectRow(selection);
        }
    };

    const tableSorting = useMemo(() => {
        if (!Array.isArray(sorting) || !sorting.length) {
            return initialSorting;
        }
        return sorting;
    }, [sorting]);

    const [columnVisibility, setColumnVisibility] = React.useState({});

    const table = useReactTable({
        data: defineData(data, loadingInitial),
        columns: defineColumns(columns, {
            canSelectAllRows,
            onSelectRow,
            onToggleRow,
            loadingInitial
        }),
        enableColumnResizing: true,
        columnResizeMode: "onChange",
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            rowSelection,
            sorting: tableSorting,
            columnVisibility
        },
        enableRowSelection: isRowSelectable,
        onRowSelectionChange,
        enableSorting: !!onSortingChange,
        manualSorting: true,
        onSortingChange,
        onColumnVisibilityChange: setColumnVisibility
    });

    return (
        <>
            <Table stickyColumns={stickyColumns} stickyRows={stickyRows} bordered={bordered}>
                <DataTableContent>
                    <TableHead table={table} />
                    <TableBody table={table} />
                </DataTableContent>
            </Table>
        </>
    );
};
