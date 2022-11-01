import React, { ReactElement } from "react";
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

import { DataTable } from "./styled";

interface Column {
    header: string | number | ReactElement;
    meta?: DataTableCellProps;
}

export type Columns<T> = Record<keyof T, Column>;

interface TableProps<T> {
    columns: Columns<T>;
    data: T[];
}

export const Table = <T,>({ data, columns }: TableProps<T>) => {
    const cols = Object.keys(columns).map(key => ({
        id: key,
        ...columns[key as keyof typeof columns]
    }));
    const columnsDefinition: ColumnDef<T>[] = cols.map(column => {
        const { id, header, meta } = column;

        return {
            accessorKey: id,
            header: () => header,
            cell: info => info.getValue(),
            meta
        };
    });

    const table = useReactTable({
        data,
        columns: columnsDefinition,
        getCoreRowModel: getCoreRowModel(),
        debugTable: true,
        debugHeaders: true,
        debugColumns: true
    });

    return (
        <DataTable>
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
        </DataTable>
    );
};
