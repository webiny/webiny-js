import React, {
    memo,
    ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    DataTableBody,
    DataTableCellProps,
    DataTableContent,
    DataTableHead,
    DataTableRow
} from "@rmwc/data-table";

import {
    Cell,
    Column as DefaultColumn,
    ColumnDef,
    ColumnSort,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    OnChangeFn,
    Row,
    RowSelectionState,
    SortingState,
    useReactTable,
    VisibilityState
} from "@tanstack/react-table";

import { Checkbox } from "~/Checkbox";
import { Skeleton } from "~/Skeleton";
import { ColumnDirectionProps } from "~/DataTable/ColumnDirection";
import { ColumnsVisibility } from "~/DataTable/ColumnsVisibility";

import "@rmwc/data-table/data-table.css";
import {
    ColumnCellWrapper,
    ColumnDirectionIcon,
    ColumnDirectionWrapper,
    ColumnHeaderWrapper,
    DataTableCell,
    Resizer,
    Table,
    TableHeadCell
} from "./styled";

export interface Column<T> {
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
    $selectable?: boolean;
};

export type TableRow<T> = Row<DefaultData & T>;

export type Sorting = SortingState;

export { ColumnSort };

export type OnSortingChange = OnChangeFn<Sorting>;

export type ColumnVisibility = VisibilityState;

export type OnColumnVisibilityChange = OnChangeFn<ColumnVisibility>;

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
    columnVisibility?: ColumnVisibility;
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
                size = 100
            } = column;

            return {
                id,
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
                    cell: () => <Skeleton containerClassName="table-skeleton-container" />
                };
            }

            return column;
        });
    }, [columns, onSelectRow, onToggleRow, loadingInitial]);
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

const typedMemo: <T>(component: T) => T = memo;

interface TableCellProps<T> {
    cell: Cell<T, unknown>;
    getColumnWidth: (column: DefaultColumn<T>) => number;
    selected: boolean;
}

const TableCell = <T,>({ cell, getColumnWidth }: TableCellProps<T>) => {
    const width = getColumnWidth(cell.column);

    return (
        <DataTableCell {...cell.column.columnDef.meta} style={{ width, maxWidth: width }}>
            <ColumnCellWrapper>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </ColumnCellWrapper>
        </DataTableCell>
    );
};

const MemoTableCell = typedMemo(TableCell);

interface TableRowProps<T> {
    selected: boolean;
    cells: Cell<T, unknown>[];
    getColumnWidth: (column: DefaultColumn<T>) => number;
}

const TableRow = <T,>({ selected, cells, getColumnWidth }: TableRowProps<T>) => {
    return (
        <DataTableRow selected={selected}>
            {cells.map(cell => (
                <MemoTableCell<T>
                    key={cell.id}
                    cell={cell}
                    getColumnWidth={getColumnWidth}
                    selected={selected}
                />
            ))}
        </DataTableRow>
    );
};

const MemoTableRow = typedMemo(TableRow);

/**
 * Empty array must be defined outside of the React component so it does not force rerendering of the DataTable
 */
const emptyArray = Array(10).fill({});

export const DataTable = <T extends Record<string, any> & DefaultData>({
    data: initialData,
    columns: initialColumns,
    onSelectRow,
    onToggleRow,
    loadingInitial,
    stickyColumns,
    stickyRows,
    bordered,
    sorting,
    columnVisibility,
    onColumnVisibilityChange,
    onSortingChange,
    isRowSelectable,
    canSelectAllRows = true,
    selectedRows = [],
    initialSorting
}: Props<T>) => {
    const tableRef = useRef<HTMLDivElement>(null);
    const [tableWidth, setTableWidth] = useState(1);

    const data = loadingInitial ? emptyArray : initialData;

    useEffect(() => {
        const updateElementWidth = () => {
            if (tableRef.current) {
                const width = tableRef.current.clientWidth;
                setTableWidth(width);
            }
        };

        updateElementWidth();

        window.addEventListener("resize", updateElementWidth);

        return () => {
            window.removeEventListener("resize", updateElementWidth);
        };
    }, [tableRef.current]);

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

    const columns = defineColumns(initialColumns, {
        canSelectAllRows,
        onSelectRow,
        onToggleRow,
        loadingInitial
    });

    const table = useReactTable<T>({
        data,
        columns,
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
        enableSortingRemoval: false,
        manualSorting: true,
        onSortingChange,
        enableHiding: !!onColumnVisibilityChange,
        onColumnVisibilityChange
    });

    const getColumnWidth = useCallback(
        (column: DefaultColumn<T>): number => {
            if (!column.getCanResize()) {
                return column.getSize();
            }

            const tableSize = table.getTotalSize();
            const columnSize = column.getSize();

            return Math.ceil((columnSize * tableWidth) / tableSize);
        },
        [table, tableWidth]
    );
    /**
     * Had to memoize the rows to avoid browser freeze.
     */
    const tableRows = useMemo(() => {
        return table.getRowModel().rows;
    }, [table, data, columns]);

    return (
        <div ref={tableRef}>
            <Table stickyColumns={stickyColumns} stickyRows={stickyRows} bordered={bordered}>
                <DataTableContent>
                    <DataTableHead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <DataTableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header, index) => {
                                    const isLastCell = index === headerGroup.headers.length - 1;
                                    const width = getColumnWidth(header.column);

                                    return (
                                        <TableHeadCell
                                            key={header.id}
                                            {...header.column.columnDef.meta}
                                            colSpan={header.colSpan}
                                            style={{ width, maxWidth: width }}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <ColumnHeaderWrapper
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    sortable={header.column.getCanSort()}
                                                    isLastCell={isLastCell}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    <ColumnDirection
                                                        direction={
                                                            header.column.getIsSorted() || undefined
                                                        }
                                                    />
                                                    {isLastCell && (
                                                        <ColumnsVisibility
                                                            columns={table.getAllColumns()}
                                                        />
                                                    )}
                                                </ColumnHeaderWrapper>
                                            )}
                                            {header.column.getCanResize() && (
                                                <Resizer
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    isResizing={header.column.getIsResizing()}
                                                />
                                            )}
                                        </TableHeadCell>
                                    );
                                })}
                            </DataTableRow>
                        ))}
                    </DataTableHead>
                    <DataTableBody>
                        {tableRows.map(row => {
                            const id = row.original.id || row.id;
                            return (
                                <MemoTableRow<T>
                                    key={id}
                                    cells={row.getVisibleCells()}
                                    selected={row.getIsSelected()}
                                    getColumnWidth={getColumnWidth}
                                />
                            );
                        })}
                    </DataTableBody>
                </DataTableContent>
            </Table>
        </div>
    );
};
