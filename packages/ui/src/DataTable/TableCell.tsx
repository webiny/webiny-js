import React, { memo } from "react";
import { DataTableCell } from "@rmwc/data-table";
import { flexRender, Cell } from "@tanstack/react-table";

const typedMemo: <T>(component: T) => T = memo;

export interface TableCellProps<T> {
    cell: Cell<T, unknown>;
}

const BaseTableCell = <T,>(props: TableCellProps<T>) => {
    return (
        <DataTableCell
            {...props.cell.column.columnDef.meta}
            style={{ width: props.cell.column.getSize() }}
        >
            {flexRender(props.cell.column.columnDef.cell, props.cell.getContext())}
        </DataTableCell>
    );
};

export const TableCell = typedMemo(BaseTableCell);
