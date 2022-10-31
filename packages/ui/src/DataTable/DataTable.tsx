import React from "react";
import {
    DataTableContent,
    DataTableHead,
    DataTableRow,
    DataTableHeadCell,
    DataTableBody,
    DataTableCell,
    DataTable
} from "@rmwc/data-table";

import { flexRender, getCoreRowModel, useReactTable, ColumnDef } from "@tanstack/react-table";

interface Column {
    id: string;
    header: string;
}

interface TableProps<T> {
    columns: Column[];
    data: T[];
}

export const Table = <T extends object>({ data, columns }: TableProps<T>) => {
    const defaultColumns: ColumnDef<T>[] = columns.map(column => {
        return {
            accessorKey: column.id,
            header: column.header,
            cell: info => info.getValue()
        };
    });

    const table = useReactTable({
        data,
        columns: defaultColumns,
        getCoreRowModel: getCoreRowModel()
    });

    return (
        <DataTable>
            <DataTableContent>
                <DataTableHead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <DataTableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <DataTableHeadCell key={header.id}>
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
                                <DataTableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                    ))}
                </DataTableBody>
            </DataTableContent>
        </DataTable>
    );
};
