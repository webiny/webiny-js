import React from "react";
import { Table } from "@tanstack/react-table";
import { TableRow } from "~/DataTable/TableRow";
import { DataTableBody } from "@rmwc/data-table";
import { DefaultData } from "~/DataTable/DataTable";

export interface TableBodyProps<T> {
    table: Table<T>;
}

export const TableBody = <T extends Record<string, any> & DefaultData>(
    props: TableBodyProps<T>
) => {
    return (
        <DataTableBody>
            {props.table.getRowModel().rows.map(row => (
                <TableRow<T>
                    key={row.original.id || row.id}
                    selected={row.getIsSelected()}
                    visibleCells={row.getVisibleCells()}
                />
            ))}
        </DataTableBody>
    );
};
