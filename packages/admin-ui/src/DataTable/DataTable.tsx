import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
    Cell,
    Column,
    ColumnDef,
    ColumnSort,
    ColumnVisibilityState,
    ExpandedState,
    OnChangeFn,
    Row,
    RowData,
    RowSelectionState,
    SortingState
} from "@tanstack/react-table";
import {
    columnResizingFeature,
    columnSizingFeature,
    columnVisibilityFeature,
    createCoreRowModel,
    createExpandedRowModel,
    createSortedRowModel,
    flexRender,
    rowExpandingFeature,
    rowSelectionFeature,
    rowSortingFeature,
    tableFeatures,
    useTable
} from "@tanstack/react-table";
import { ReactComponent as KeyboardArrowDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { IconButton } from "~/Button/index.js";
import { CheckboxPrimitive } from "~/Checkbox/index.js";
import { Skeleton } from "~/Skeleton/index.js";
import { Table } from "~/Table/index.js";
import { ColumnSorter, ColumnsVisibility } from "./components/index.js";
import { cn, makeDecoratable } from "~/utils.js";

const features = tableFeatures({
    columnResizingFeature,
    columnSizingFeature,
    columnVisibilityFeature,
    rowExpandingFeature,
    rowSelectionFeature,
    rowSortingFeature,
    expandedRowModel: createExpandedRowModel(),
    sortedRowModel: createSortedRowModel(),
    coreRowModel: createCoreRowModel()
});

type Features = typeof features;

interface DataTableColumn<T> {
    /*
     * Column header component.
     */
    header?: string | number | React.JSX.Element;
    /*
     * Cell renderer, receives the full row and returns the value to render inside the cell.
     */
    cell?: (row: T) => string | number | React.JSX.Element | null;
    /*
     * Column size.
     */
    size?: number;
    /*
     * Should truncate?
     */
    truncate?: boolean;
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
    /*
     * Accessor key for the column data path.
     */
    accessorKey?: string;
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

type DataTableRow<T extends RowData> = Row<Features, DataTableDefaultData & T>;

type DataTableSorting = SortingState;

type DataTableColumnSort = ColumnSort;

type OnDataTableSortingChange = OnChangeFn<DataTableSorting>;

type DataTableColumnVisibility = ColumnVisibilityState;

type OnDataTableColumnVisibilityChange = OnChangeFn<DataTableColumnVisibility>;

/**
 * Which rows show their sub-rows: `true` for every row, or a map of row ids (the `id` of each entry).
 */
type DataTableExpanded = ExpandedState;

type OnDataTableExpandedChange = OnChangeFn<DataTableExpanded>;

interface DataTableProps<TEntry extends RowData> {
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
     * Returns the sub-rows listed under a row, e.g. the versions of an entry. A row with sub-rows
     * gets a toggle in its first column that shows and hides them. Each entry, sub-rows included,
     * must have a unique `id`.
     */
    getSubRows?: (row: TEntry) => TEntry[] | undefined;
    /**
     * Which rows show their sub-rows. Leave it out to let the DataTable keep track of it.
     */
    expanded?: DataTableExpanded;
    /**
     * Callback that receives the expanded state when a row's toggle is clicked.
     */
    onExpandedChange?: OnDataTableExpandedChange;
    /**
     * Which rows show their sub-rows at first, when `expanded` isn't passed. Defaults to none.
     */
    initialExpanded?: DataTableExpanded;
    /**
     * Callback that is called to determine if the row is selectable.
     */
    isRowSelectable?: (row: Row<Features, TEntry>) => boolean;
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

interface DefineColumnsOptions<TEntry extends RowData> {
    canSelectAllRows: boolean;
    expandable: boolean;
    onSelectRow?: DataTableProps<TEntry>["onSelectRow"];
    onToggleRow: DataTableProps<TEntry>["onToggleRow"];
    loading: DataTableProps<TEntry>["loading"];
}

const defineColumns = <T extends RowData>(
    columns: DataTableProps<T>["columns"],
    options: DefineColumnsOptions<T>
): ColumnDef<Features, T>[] => {
    const { canSelectAllRows, expandable, onSelectRow, onToggleRow, loading } = options;

    return useMemo(() => {
        const columnsList = Object.keys(columns).map(key => ({
            id: key,
            ...columns[key as keyof typeof columns]
        }));

        const defaults: ColumnDef<Features, T>[] = columnsList.map(column => {
            const {
                accessorKey,
                cell,
                className,
                enableHiding = true,
                enableResizing = true,
                enableSorting = false,
                header,
                truncate = true,
                id,
                size = 100
            } = column;

            return {
                id,
                accessorKey: accessorKey || id,
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
                    className,
                    truncate
                },
                enableResizing,
                size,
                enableHiding
            };
        });

        if (expandable && defaults[0]) {
            defaults[0] = withExpandToggle(defaults[0]);
        }

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
    }, [columns, expandable, onSelectRow, onToggleRow, loading]);
};

/**
 * Puts a row's expand toggle before the first column's content, indented by the row's depth, so a
 * sub-row's content lines up under its parent's. A row without sub-rows keeps the toggle's space.
 */
const withExpandToggle = <T extends RowData>(
    column: ColumnDef<Features, T>
): ColumnDef<Features, T> => {
    return {
        ...column,
        cell: props => {
            if (!props) {
                return null;
            }

            const { row } = props;
            const isExpanded = row.getIsExpanded();

            return (
                <div className={"flex items-center gap-xs min-w-0"}>
                    {Array.from({ length: row.depth }, (_, index) => (
                        <span key={index} className={"size-md shrink-0"} aria-hidden={true} />
                    ))}
                    {row.getCanExpand() ? (
                        <IconButton
                            variant={"ghost"}
                            size={"xs"}
                            className={"shrink-0"}
                            icon={
                                <KeyboardArrowDownIcon
                                    className={cn("transition-transform", {
                                        "-rotate-90": !isExpanded
                                    })}
                                />
                            }
                            aria-label={isExpanded ? "Collapse row" : "Expand row"}
                            aria-expanded={isExpanded}
                            onClick={e => {
                                e.stopPropagation();
                                row.toggleExpanded();
                            }}
                        />
                    ) : (
                        <span className={"size-md shrink-0"} aria-hidden={true} />
                    )}
                    <div className={"min-w-0 flex-1 truncate"}>
                        {column.cell ? React.createElement(column.cell as any, props) : null}
                    </div>
                </div>
            );
        }
    };
};

type GetRowId<T> = (row: T, index: number, parentId?: string) => string;

/**
 * TanStack's own row ids: the index, joined to the parent's id for a sub-row ("0", "0.1").
 */
const indexRowId = <T,>(_: T, index: number, parentId?: string) => {
    return parentId ? `${parentId}.${index}` : String(index);
};

const entryRowId = <T extends DataTableDefaultData>(row: T) => row.id;

/**
 * Every row by the id the table gives it, sub-rows included, to map the selection state back to entries.
 */
const getRowsById = <T,>(
    data: T[],
    getRowId: GetRowId<T>,
    getSubRows?: (row: T) => T[] | undefined
): Map<string, T> => {
    const rows = new Map<string, T>();

    const visit = (items: T[], parentId?: string) => {
        items.forEach((item, index) => {
            const id = getRowId(item, index, parentId);
            rows.set(id, item);
            const subRows = getSubRows?.(item);
            if (subRows?.length) {
                visit(subRows, id);
            }
        });
    };

    visit(data);

    return rows;
};

const typedMemo: <T>(component: T) => T = memo;

interface TableCellProps<T extends RowData> {
    cell: Cell<Features, T, unknown>;
    getColumnWidth: (column: Column<Features, T>) => number;
    // Not rendered: it makes the memoized cell re-render its toggle when the row is expanded or collapsed.
    expanded?: boolean;
}

const TableCell = <T extends RowData>({ cell, getColumnWidth }: TableCellProps<T>) => {
    const width = getColumnWidth(cell.column);

    return (
        <Table.Cell {...cell.column.columnDef.meta} style={{ width, maxWidth: width }}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </Table.Cell>
    );
};

const MemoTableCell = typedMemo(TableCell);

interface TableRowProps<T extends RowData> {
    selected: boolean;
    expanded: boolean;
    depth: number;
    cells: Cell<Features, T, unknown>[];
    getColumnWidth: (column: Column<Features, T>) => number;
}

const TableRow = <T extends RowData>({
    selected,
    expanded,
    depth,
    cells,
    getColumnWidth
}: TableRowProps<T>) => {
    return (
        <Table.Row selected={selected} data-depth={depth}>
            {cells.map(cell => (
                <MemoTableCell<T>
                    key={cell.id}
                    cell={cell}
                    getColumnWidth={getColumnWidth}
                    expanded={expanded}
                />
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
    expanded,
    getSubRows: initialGetSubRows,
    initialExpanded,
    initialSorting,
    isRowSelectable,
    loading,
    onColumnVisibilityChange,
    onExpandedChange,
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
    // The loading skeleton rows have no sub-rows.
    const getSubRows = loading ? undefined : initialGetSubRows;
    const expandable = !!getSubRows;
    // Expanded rows are tracked by entry id, so it survives new data; a flat table keeps index ids.
    const getRowId: GetRowId<T> = expandable ? entryRowId : indexRowId;

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

    const rowsById = useMemo(() => {
        return getRowsById<T>(data, getRowId, getSubRows);
    }, [data, getRowId, getSubRows]);

    const rowSelection = useMemo(() => {
        const selectedIds = new Set(selectedRows.map(item => item.id));
        const selection: RowSelectionState = {};
        for (const [rowId, row] of rowsById) {
            if (selectedIds.has(row.id)) {
                selection[rowId] = true;
            }
        }
        return selection;
    }, [selectedRows, rowsById]);

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
            onToggleRow(rowsById.get(toggledRows[0]) as T);
            return;
        } else if (typeof onSelectRow === "function") {
            const selection = Object.keys(newSelection)
                .map(key => rowsById.get(key))
                .filter((row): row is T => !!row);
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
        expandable,
        onSelectRow,
        onToggleRow,
        loading
    });

    const table = useTable<typeof features, T>({
        features,
        columnResizeMode: "onChange",
        columns,
        data,
        getSubRows,
        getRowId: expandable ? (row, index, parent) => getRowId(row, index, parent?.id) : undefined,
        enableExpanding: expandable,
        // Keep what the user expanded or collapsed when the data changes (e.g. after a row action).
        autoResetExpanded: false,
        enableColumnResizing: true,
        enableHiding: !!onColumnVisibilityChange,
        enableRowSelection: isRowSelectable,
        enableSorting: !!onSortingChange,
        enableSortingRemoval: false,
        manualSorting: true,
        onColumnVisibilityChange,
        // An `onExpandedChange` key, even `undefined`, makes the table leave the expanded state to it.
        ...(onExpandedChange ? { onExpandedChange } : {}),
        onRowSelectionChange,
        onSortingChange,
        initialState: {
            expanded: initialExpanded ?? {}
        },
        state: {
            columnVisibility,
            rowSelection,
            sorting: tableSorting,
            ...(expanded === undefined ? {} : { expanded })
        }
    });

    const expandedState = table.state.expanded;

    const getColumnWidth = useCallback(
        (column: Column<Features, T>): number => {
            // Non-resizable columns (e.g. row-selection, actions) keep their fixed size.
            if (!column.getCanResize()) {
                return column.getSize();
            }

            /**
             * Resizable columns share the space left after the fixed columns, proportionally to
             * their own size. This makes the table always fill the full container width — even when
             * columns are hidden — so trailing content (e.g. the columns-visibility cog) stays
             * flush right instead of drifting left as columns are removed.
             */
            const visibleColumns = table.getVisibleLeafColumns();
            const fixedTotal = visibleColumns
                .filter(col => !col.getCanResize())
                .reduce((total, col) => total + col.getSize(), 0);
            const resizableTotal = visibleColumns
                .filter(col => col.getCanResize())
                .reduce((total, col) => total + col.getSize(), 0);

            if (resizableTotal === 0) {
                return column.getSize();
            }

            const available = Math.max(tableWidth - fixedTotal, 0);

            return Math.ceil((column.getSize() * available) / resizableTotal);
        },
        [table, tableWidth]
    );

    /**
     * Had to memoize the rows to avoid browser freeze.
     */
    const tableRows = useMemo(() => {
        return table.getRowModel().rows;
    }, [table, data, columns, expandedState]);

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
                                                <div
                                                    className={cn({
                                                        "w-full overflow-hidden whitespace-nowrap": true,
                                                        truncate: !isLastCell
                                                    })}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                </div>
                                                <Table.Direction
                                                    direction={header.column.getIsSorted() || null}
                                                />
                                                {isLastCell && (
                                                    <div className={"h-md"}>
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
                                expanded={row.getIsExpanded()}
                                depth={row.depth}
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
    type Features,
    type DataTableProps,
    type DataTableColumn,
    type DataTableColumns,
    type DataTableDefaultData,
    type DataTableRow,
    type DataTableSorting,
    type DataTableColumnSort,
    type OnDataTableSortingChange,
    type DataTableColumnVisibility,
    type OnDataTableColumnVisibilityChange,
    type DataTableExpanded,
    type OnDataTableExpandedChange
};
