import React from "react";
import { Column as DataTableColumn } from "@webiny/ui/DataTable";
import { Column, ColumnDTO } from "./Column";

export class ColumnMapper {
    static toDTO(column: Column | ColumnDTO): ColumnDTO {
        return {
            cell: column.cell,
            className: column.className,
            header: column.header,
            hideable: column.hideable,
            name: column.name,
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
        ) => string | number | JSX.Element | null
    ): DataTableColumn<T> {
        return {
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
