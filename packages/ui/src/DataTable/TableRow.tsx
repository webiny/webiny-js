import React, { memo } from "react";
import { DataTableRow } from "@rmwc/data-table";
import { Cell } from "@tanstack/react-table";
import { TableCell } from "~/DataTable/TableCell";

const typedMemo: <T>(component: T) => T = memo;

export interface TableRowProps<T> {
    visibleCells: Cell<T, unknown>[];
    selected: boolean;
}

const BaseTableRow = <T,>(props: TableRowProps<T>) => {
    return (
        <DataTableRow selected={props.selected}>
            {props.visibleCells.map(cell => {
                return <TableCell<T> key={cell.id} cell={cell} />;
            })}
        </DataTableRow>
    );
};

export const TableRow = typedMemo(BaseTableRow);
