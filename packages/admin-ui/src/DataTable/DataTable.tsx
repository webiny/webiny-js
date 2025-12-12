import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
    Cell,
    Column,
    ColumnDef,
    ColumnSort,
    OnChangeFn,
    Row,
    RowSelectionState,
    SortingState,
    VisibilityState
} from "@tanstack/react-table";
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable
} from "@tanstack/react-table";
import { CheckboxPrimitive } from "~/Checkbox/index.js";
import { Skeleton } from "~/Skeleton/index.js";
import { Table } from "~/Table/index.js";
import { ColumnSorter, ColumnsVisibility } from "./components/index.js";
import { cn, makeDecoratable } from "~/utils.js";

interface DataTableColumn<T> {
    /*
     * Column header component.
     */
    header?: string | number | JSX.Element;
    /*
     * Cell renderer, receives the full row and returns the value to render inside the cell.
     */
    cell?: (row: T) => string | number | JSX.Element | null;
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

type DataTableColumns<T> = {
    [P in keyof T]?: DataTableColumn<T>;
};

type DataTableDefaultData = {
    id: string;
    /*
     * Define if a specific row can be selected.
     */
    $selectable?: boolean;
};

type DataTableRow<T> = Row<DataTableDefaultData & T>;

type DataTableSorting = SortingState;

type DataTableColumnSort = ColumnSort;

type OnDataTableSortingChange = OnChangeFn<DataTableSorting>;

type DataTableColumnVisibility = VisibilityState;

type OnDataTableColumnVisibilityChange = OnChangeFn<DataTableColumnVisibility>;

interface DataTableProps<TEntry> {
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
    columns: DataTableColumns<TEntry>;
    /**
     * The column visibility state.
     */
    columnVisibility?: DataTableColumnVisibility;
    /**
     * Callback that receives current column visibility state.
     */
    onColumnVisibilityChange?: OnDataTableColumnVisibilityChange;
    /**
     * Data to display into DataTable body.
     */
    data: TEntry[];
    /**
     * Callback that is called to determine if the row is selectable.
     */
    isRowSelectable?: (row: Row<TEntry>) => boolean;
    /**
     * Render the skeleton state while data are loading.
     */
    loading?: boolean;
    /**
     * Callback that receives the selected rows.
     */
    onSelectRow?: (rows: TEntry[]) => void;
    /**
     * Callback that receives the toggled row.
     */
    onToggleRow?: (row: TEntry) => void;
    /**
     * Callback that receives current sorting state.
     */
    onSortingChange?: OnDataTableSortingChange;
    /**
     * Selected rows.
     */
    selectedRows?: TEntry[];
    /**
     * Sorting state.
     */
    sorting?: DataTableSorting;
    /**
     * Initial sorting state.
     */
    initialSorting?: DataTableSorting;
    /**
     * Enable sticky header.
     */
    stickyHeader?: boolean;
}

interface DefineColumnsOptions<TEntry> {
    canSelectAllRows: boolean;
    onSelectRow?: DataTableProps<TEntry>["onSelectRow"];
    onToggleRow: DataTableProps<TEntry>["onToggleRow"];
    loading: DataTableProps<TEntry>["loading"];
}

const defineColumns = <T,>(
    columns: DataTableProps<T>["columns"],
    options: DefineColumnsOptions<T>
): ColumnDef<T>[] => {
    const { canSelectAllRows, onSelectRow, onToggleRow, loading } = options;

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
                size = 100
            } = column;

            return {
                id,
                accessorKey: id,
                header: () => header,
                cell: props => {
                    if (cell && typeof cell === "function") {
                        return cell(props.row.original);
                    } else {
                        // Automatically convert any cell value to a string for rendering,
                        // ensuring the table displays values correctly. This aligns with React's
                        // rendering, which expects JSX, strings or null.
                        // https://github.com/TanStack/table/issues/1042
                        return props.getValue() ? String(props.getValue()) : null;
                    }
                },
                enableSorting,
                meta: {
                    className
                },
                enableResizing,
                size,
                enableHiding
            };
        });

        let columnsDefs = defaults;
        const firstColumn = defaults[0];
        const isSelectable = onToggleRow || onSelectRow;

        if (isSelectable && firstColumn) {
            columnsDefs = [
                {
                    ...firstColumn,
                    accessorKey: firstColumn.id as string,
                    header: props => {
                        if (!props) {
                            return null;
                        }

                        return (
                            <div className={"flex items-center gap-xl"}>
                                <CheckboxPrimitive
                                    indeterminate={props.table.getIsSomeRowsSelected()}
                                    checked={props.table.getIsAllRowsSelected()}
                                    onChange={props.table.toggleAllPageRowsSelected}
                                    aria-label="Select all"
                                    disabled={!canSelectAllRows}
                                    onClick={e => e.stopPropagation()}
                                />
                                {firstColumn.header
                                    ? React.createElement(firstColumn.header, props)
                                    : null}
                            </div>
                        );
                    },
                    cell: props => {
                        if (!props) {
                            return null;
                        }
                        return (
                            <div className={"flex items-center gap-xl"}>
                                <CheckboxPrimitive
                                    checked={props.row.getIsSelected()}
                                    onChange={value => props.row.toggleSelected(!!value)}
                                    disabled={!props.row.getCanSelect()}
                                    aria-label="Select row"
                                    className={cn(!props.row.getCanSelect() ? "invisible" : "")}
                                />
                                {firstColumn.cell
                                    ? React.createElement(firstColumn.cell, props)
                                    : null}
                            </div>
                        );
                    }
                },
                ...defaults.slice(1)
            ];
        }

        return columnsDefs.map(column => {
            if (loading) {
                return {
                    ...column,
                    cell: () => <Skeleton type={"text"} size={"md"} />
                };
            }

            return column;
        });
    }, [columns, onSelectRow, onToggleRow, loading]);
};

const typedMemo: <T>(component: T) => T = memo;

interface TableCellProps<T> {
    cell: Cell<T, unknown>;
    getColumnWidth: (column: Column<T>) => number;
}

const TableCell = <T,>({ cell, getColumnWidth }: TableCellProps<T>) => {
    const width = getColumnWidth(cell.column);

    return (
        <Table.Cell {...cell.column.columnDef.meta} style={{ width, maxWidth: width }}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </Table.Cell>
    );
};

const MemoTableCell = typedMemo(TableCell);

interface TableRowProps<T> {
    selected: boolean;
    cells: Cell<T, unknown>[];
    getColumnWidth: (column: Column<T>) => number;
}

const TableRow = <T,>({ selected, cells, getColumnWidth }: TableRowProps<T>) => {
    return (
        <Table.Row selected={selected}>
            {cells.map(cell => (
                <MemoTableCell<T> key={cell.id} cell={cell} getColumnWidth={getColumnWidth} />
            ))}
        </Table.Row>
    );
};

const MemoTableRow = typedMemo(TableRow);

/**
 * Empty array must be defined outside the React component so it does not force rerendering of the DataTable
 */
const emptyArray = Array(10).fill({});

const DecoratableDataTable = <T extends Record<string, any> & DataTableDefaultData>({
    bordered,
    canSelectAllRows = true,
    columnVisibility,
    columns: initialColumns,
    data: initialData,
    initialSorting,
    isRowSelectable,
    loading,
    onColumnVisibilityChange,
    onSelectRow,
    onSortingChange,
    onToggleRow,
    selectedRows = [],
    sorting,
    stickyHeader
}: DataTableProps<T>) => {
    const tableRef = useRef<HTMLDivElement>(null);
    const [tableWidth, setTableWidth] = useState(1);

    const data = loading ? emptyArray : initialData;

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
        loading
    });

    const table = useReactTable<T>({
        columnResizeMode: "onChange",
        columns,
        data,
        enableColumnResizing: true,
        enableHiding: !!onColumnVisibilityChange,
        enableRowSelection: isRowSelectable,
        enableSorting: !!onSortingChange,
        enableSortingRemoval: false,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualSorting: true,
        onColumnVisibilityChange,
        onRowSelectionChange,
        onSortingChange,
        state: {
            columnVisibility,
            rowSelection,
            sorting: tableSorting
        }
    });

    const getColumnWidth = useCallback(
        (column: Column<T>): number => {
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
            <Table bordered={bordered} sticky={stickyHeader}>
                <Table.Header sticky={stickyHeader}>
                    {table.getHeaderGroups().map(headerGroup => (
                        <Table.Row key={headerGroup.id}>
                            {headerGroup.headers.map((header, index) => {
                                const isLastCell = index === headerGroup.headers.length - 1;
                                const width = getColumnWidth(header.column);

                                return (
                                    <Table.Head
                                        key={header.id}
                                        {...header.column.columnDef.meta}
                                        colSpan={header.colSpan}
                                        style={{ width, maxWidth: width }}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <ColumnSorter
                                                onClick={header.column.getToggleSortingHandler()}
                                                sortable={header.column.getCanSort()}
                                            >
                                                <div className="w-full overflow-hidden whitespace-nowrap truncate">
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                </div>
                                                <Table.Direction
                                                    direction={header.column.getIsSorted() || null}
                                                />
                                                {isLastCell && (
                                                    <div className={"mr-xs h-md"}>
                                                        <ColumnsVisibility
                                                            columns={table.getAllColumns()}
                                                        />
                                                    </div>
                                                )}
                                            </ColumnSorter>
                                        )}
                                        {header.column.getCanResize() && (
                                            <Table.Resizer
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                                isResizing={header.column.getIsResizing()}
                                            />
                                        )}
                                    </Table.Head>
                                );
                            })}
                        </Table.Row>
                    ))}
                </Table.Header>
                <Table.Body>
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
                </Table.Body>
            </Table>
        </div>
    );
};

const DataTable = makeDecoratable("DataTable", DecoratableDataTable);

export {
    DataTable,
    type DataTableProps,
    type DataTableColumn,
    type DataTableColumns,
    type DataTableDefaultData,
    type DataTableRow,
    type DataTableSorting,
    type DataTableColumnSort,
    type OnDataTableSortingChange,
    type DataTableColumnVisibility,
    type OnDataTableColumnVisibilityChange
};
