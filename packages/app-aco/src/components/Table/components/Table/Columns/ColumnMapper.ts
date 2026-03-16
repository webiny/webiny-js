import type React from "react";
import type { DataTableColumn } from "@webiny/admin-ui";
import type { Column, ColumnDTO } from "./Column.js";

export class ColumnMapper {
    static toDTO(column: Column | ColumnDTO): ColumnDTO {
        return {
            cell: column.cell,
            className: column.className,
            header: column.header,
            hideable: column.hideable,
            name: column.name,
            path: column.path,
            resizable: column.resizable,
            size: column.size,
            sortable: column.sortable,
            visible: column.visible
        };
    }

    static toDataTable<T>(
        column: ColumnDTO,
        cellRenderer: (
            row: T,
            cell: string | React.ReactElement
        ) => string | number | React.JSX.Element | null
    ): DataTableColumn<T> {
        // Prefix path with "data." if provided.
        const accessorKey = column.path ? `data.${column.path}` : undefined;

        return {
            accessorKey,
            header: column.header,
            className: column.className,
            size: column.size,
            enableHiding: column.hideable,
            enableResizing: column.resizable,
            enableSorting: column.sortable,
            cell: column.cell ? (row: T) => cellRenderer(row, column.cell) : undefined
        };
    }
}
