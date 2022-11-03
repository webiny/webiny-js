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

import { Checkbox } from "~/Checkbox";

import { flexRender, getCoreRowModel, useReactTable, ColumnDef } from "@tanstack/react-table";

import "@rmwc/data-table/data-table.css";
import { Table } from "./styled";

interface Column<T> {
    /*
     * Column header component.
     */
    header: string | number | ReactElement;
    /*
     * Cell renderer, receives the cell value and returns the value to render inside the cell.
     */
    cell?: (value: T) => unknown;
    /*
     * Additional props to add to both header and row cells. Refer to RMWC documentation.
     */
    meta?: DataTableCellProps;
}

export type Columns<T> = {
    [P in keyof T]: Column<T[P]>;
};

interface Props<T> {
    columns: Columns<T>;
    data: T[];
}

export const DataTable = <T,>({ data, columns }: Props<T>) => {
    const [rowSelection, setRowSelection] = React.useState({});

    console.log(rowSelection);

    const filterColumn: ColumnDef<T> = {
        id: "select",
        header: ({ table }) => (
            <>
                <Checkbox
                    indeterminate={table.getIsSomeRowsSelected()}
                    value={table.getIsAllRowsSelected()}
                    onChange={e => table.toggleAllPageRowsSelected(e.target)}
                />
            </>
        ),
        cell: ({ row }) => (
            <Checkbox
                indeterminate={row.getIsSomeSelected()}
                value={row.getIsSelected()}
                onChange={row.getToggleSelectedHandler()}
            />
        ),
        meta: {
            hasFormControl: true
        }
    };

    const columnsDefinition: ColumnDef<T>[] = useMemo(() => {
        const columnsList = Object.keys(columns).map(key => ({
            id: key,
            ...columns[key as keyof typeof columns]
        }));

        return columnsList.map(column => {
            const { id, header, meta, cell } = column;

            return {
                accessorKey: id,
                header: () => header,
                cell: info => {
                    const value = info.getValue() as any;

                    if (cell && typeof cell === "function") {
                        return cell(value);
                    } else {
                        return value;
                    }
                },
                meta
            };
        });
    }, [columns]);

    const table = useReactTable({
        data,
        columns: [filterColumn, ...columnsDefinition],
        getCoreRowModel: getCoreRowModel(),
        state: {
            rowSelection
        },
        onRowSelectionChange: setRowSelection
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
