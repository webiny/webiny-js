import React, { useMemo } from "react";
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
}

export type Columns<T> = {
    [P in keyof T]?: Column<T>;
};

interface Props<T> {
    columns: Columns<T>;
    data: T[];
}

const defineColumns = <T,>(columns: Props<T>["columns"]): ColumnDef<T>[] =>
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

        return defaults;
    }, [columns]);

export const DataTable = <T,>({ data, columns }: Props<T>) => {
    const table = useReactTable({
        data,
        columns: defineColumns(columns),
        getCoreRowModel: getCoreRowModel()
    });

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
                        <DataTableRow key={row.id}>
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
