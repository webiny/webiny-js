import React, { ReactElement, useMemo } from "react";

import {
    DataTableContent,
    DataTableHead,
    DataTableRow,
    DataTableHeadCell,
    DataTableBody,
    DataTableCell,
    DataTableCellProps
} from "@rmwc/data-table";

import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnDef,
    getSortedRowModel,
    OnChangeFn,
    SortingState,
    RowSelectionState,
    Row
} from "@tanstack/react-table";

import { Checkbox } from "~/Checkbox";
import { Skeleton } from "~/Skeleton";

import "@rmwc/data-table/data-table.css";
import { ColumnDirectionIcon, ColumnDirectionWrapper, ColumnHeaderWrapper, Table } from "./styled";

interface Column<T> {
    /*
     * Column header component.
     */
    header: string | number | JSX.Element;
    /*
     * Cell renderer, receives the full row and returns the value to render inside the cell.
     */
    cell?: (row: T) => string | number | JSX.Element;
    /*
     * Additional props to add to both header and row cells. Refer to RMWC documentation.
     */
    meta?: DataTableCellProps;
    /*
     * Column class names.
     */
    className?: string;
    /*
     * Enable column sorting.
     */
    enableSorting?: boolean;
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
     * The number of columns to affix to the side of the table when scrolling.
     */
    stickyColumns?: number;
    /**
     * The number of rows to affix to the top of the table when scrolling.
     */
    stickyRows?: number;
}

export interface ColumnDirectionProps {
    direction?: "asc" | "desc";
}

interface DefineColumnsOptions<T> {
    canSelectAllRows: boolean;
    onSelectRow: Props<T>["onSelectRow"];
    loadingInitial: Props<T>["loadingInitial"];
}

const defineColumns = <T,>(
    columns: Props<T>["columns"],
    options: DefineColumnsOptions<T>
): ColumnDef<T>[] => {
    const { canSelectAllRows, onSelectRow, loadingInitial } = options;

    return useMemo(() => {
        const columnsList = Object.keys(columns).map(key => ({
            id: key,
            ...columns[key as keyof typeof columns]
        }));

        const defaults: ColumnDef<T>[] = columnsList.map(column => {
            const { id, header, meta, cell, enableSorting = false, className } = column;

            return {
                accessorKey: id,
                header: () => header,
                cell: info => {
                    if (cell && typeof cell === "function") {
                        return cell(info.row.original);
                    } else {
                        return info.getValue();
                    }
                },
                enableSorting,
                meta: {
                    ...meta,
                    className
                }
            };
        });

        const select: ColumnDef<T>[] = !!onSelectRow
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
                          hasFormControl: true,
                          className: "datatable-select-column"
                      },
                      enableSorting: false
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
    }, [columns, onSelectRow, loadingInitial]);
};

const defineData = <T,>(
    data: Props<T>["data"],
    loadingInitial: Props<T>["loadingInitial"]
): T[] => {
    return useMemo(() => {
        if (loadingInitial) {
            return Array(10).fill({});
        }
        return data;
    }, [data, loadingInitial]);
};

const ColumnDirection = ({ direction }: ColumnDirectionProps): ReactElement | null => {
    if (direction) {
        return (
            <ColumnDirectionWrapper>
                <ColumnDirectionIcon direction={direction} />
            </ColumnDirectionWrapper>
        );
    }

    return null;
};

export const DataTable = <T extends Object & DefaultData>({
    data,
    columns,
    onSelectRow,
    loadingInitial,
    stickyColumns,
    stickyRows,
    bordered,
    sorting,
    onSortingChange,
    isRowSelectable,
    canSelectAllRows = true,
    selectedRows = []
}: Props<T>) => {
    const rowSelection = useMemo(() => {
        return selectedRows.reduce<RowSelectionState>((acc, item) => {
            const recordIndex = data.findIndex(rec => rec.id === item.id);
            return { ...acc, [recordIndex]: true };
        }, {});
    }, [selectedRows, data]);

    const onRowSelectionChange: OnChangeFn<RowSelectionState> = updater => {
        if (typeof onSelectRow === "function") {
            const newSelection = typeof updater === "function" ? updater(rowSelection) : updater;
            const selection = Object.keys(newSelection).map(key => data[parseInt(key)]);
            onSelectRow(selection);
        }
    };

    const table = useReactTable({
        data: defineData(data, loadingInitial),
        columns: defineColumns(columns, { canSelectAllRows, onSelectRow, loadingInitial }),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            rowSelection,
            sorting
        },
        enableRowSelection: isRowSelectable,
        onRowSelectionChange,
        enableSorting: !!onSortingChange,
        manualSorting: true,
        onSortingChange
    });

    return (
        <Table stickyColumns={stickyColumns} stickyRows={stickyRows} bordered={bordered}>
            <DataTableContent>
                <DataTableHead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <DataTableRow key={headerGroup.id}>
                            {headerGroup.headers.map(
                                ({ id, isPlaceholder, column, getContext }) => (
                                    <DataTableHeadCell key={id} {...column.columnDef.meta}>
                                        {isPlaceholder ? null : (
                                            <ColumnHeaderWrapper
                                                onClick={column.getToggleSortingHandler()}
                                                sortable={column.getCanSort()}
                                            >
                                                {flexRender(column.columnDef.header, getContext())}
                                                <ColumnDirection
                                                    direction={column.getIsSorted() || undefined}
                                                />
                                            </ColumnHeaderWrapper>
                                        )}
                                    </DataTableHeadCell>
                                )
                            )}
                        </DataTableRow>
                    ))}
                </DataTableHead>
                <DataTableBody>
                    {table.getRowModel().rows.map(row => (
                        <DataTableRow
                            key={row.id}
                            selected={row.getIsSelected()}
                            data-testid="datatable-row"
                        >
                            {row.getVisibleCells().map(cell => (
                                <DataTableCell key={cell.id} {...cell.column.columnDef.meta}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                    ))}
                </DataTableBody>
            </DataTableContent>
        </Table>
    );
};
