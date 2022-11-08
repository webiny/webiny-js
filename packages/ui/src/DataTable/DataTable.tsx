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
}

export type Columns<T> = {
    [P in keyof T]?: Column<T>;
};

interface Props<T> {
    columns: Columns<T>;
    data: T[];
    onSelectRow?: (rows: T[] | []) => void;
}

const defineColumns = <T,>(
    columns: Props<T>["columns"],
    onSelectRow: Props<T>["onSelectRow"]
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
                      header: ({ table }) => (
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

        return [...select, ...defaults];
    }, [columns, onSelectRow]);

export const DataTable = <T,>({ data, columns, onSelectRow }: Props<T>) => {
    const [rowSelection, setRowSelection] = React.useState({});

    const table = useReactTable({
        data,
        columns: defineColumns(columns, onSelectRow),
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
