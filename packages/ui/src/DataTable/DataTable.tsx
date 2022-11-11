import React, { useEffect, useMemo } from "react";
import {
    DataTableContent,
    DataTableHead,
    DataTableRow,
    DataTableHeadCell,
    DataTableBody,
    DataTableCell,
    DataTableCellProps
} from "@rmwc/data-table";

import { flexRender, getCoreRowModel, useReactTable, ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "~/Checkbox";
import { Skeleton } from "~/Skeleton";

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
    cell?: (row: T) => string | number | JSX.Element;
    /*
     * Additional props to add to both header and row cells. Refer to RMWC documentation.
     */
    meta?: DataTableCellProps;
    /*
     * Column class names.
     */
    className?: string;
    isSelectable?: boolean;
}

export type Columns<T> = {
    [P in keyof T]?: Column<T>;
};

interface Props<T> {
    /*
     * Columns definition.
     */
    columns: Columns<T>;
    /*
     * Data to display into DataTable body.
     */
    data: T[];
    /*
     * Callback that receives the selected rows.
     */
    onSelectRow?: (rows: T[] | []) => void;
    /*
     * Render the skeleton state at the initial data loading.
     */
    loadingInitial?: boolean;
}

const defineColumns = <T,>(
    columns: Props<T>["columns"],
    onSelectRow: Props<T>["onSelectRow"],
    loadingInitial: Props<T>["loadingInitial"]
): ColumnDef<T>[] =>
    useMemo(() => {
        const columnsList = Object.keys(columns).map(key => ({
            id: key,
            ...columns[key as keyof typeof columns]
        }));

        const defaults: ColumnDef<T>[] = columnsList.map(column => {
            const { id, header, meta, cell } = column;

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
                meta
            };
        });

        const select: ColumnDef<T>[] = !!onSelectRow
            ? [
                  {
                      id: "datatable-select-column",
                      header: ({ table }) =>
                          !loadingInitial && (
                              <Checkbox
                                  indeterminate={table.getIsSomeRowsSelected()}
                                  value={table.getIsAllRowsSelected()}
                                  onChange={e => table.toggleAllPageRowsSelected(e)}
                              />
                          ),
                      cell: ({ row }) => (
                          <Checkbox
                              indeterminate={row.getIsSomeSelected()}
                              value={row.getIsSelected()}
                              onChange={row.getToggleSelectedHandler()}
                          />
                      ),
                      meta: {
                          hasFormControl: true,
                          className: "datatable-select-column"
                      }
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

export const DataTable = <T,>({ data, columns, onSelectRow, loadingInitial }: Props<T>) => {
    const [rowSelection, setRowSelection] = React.useState({});

    const table = useReactTable({
        data: defineData(data, loadingInitial),
        columns: defineColumns(columns, onSelectRow, loadingInitial),
        getCoreRowModel: getCoreRowModel(),
        state: {
            rowSelection
        },
        enableRowSelection: !!onSelectRow,
        onRowSelectionChange: setRowSelection
    });

    useEffect(() => {
        if (onSelectRow && typeof onSelectRow === "function") {
            const dataSelected = table.getSelectedRowModel().flatRows.map(row => row.original);
            onSelectRow(dataSelected);
        }
    }, [rowSelection]);

    return (
        <Table>
            <DataTableContent>
                <DataTableHead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <DataTableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <DataTableHeadCell
                                    key={header.id}
                                    {...header.column.columnDef.meta}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                </DataTableHeadCell>
                            ))}
                        </DataTableRow>
                    ))}
                </DataTableHead>
                <DataTableBody>
                    {table.getRowModel().rows.map(row => (
                        <DataTableRow
                            key={row.id}
                            selected={rowSelection.hasOwnProperty(row.index)}
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
