import React from "react";
import { DataTableHead, DataTableRow } from "@rmwc/data-table";
import { flexRender, Table } from "@tanstack/react-table";
import { ColumnDirection } from "~/DataTable/ColumnDirection";
import { ColumnSelector } from "~/DataTable/ColumnSelector";
import { ColumnHeaderWrapper, Resizer, TableHeadCell } from "~/DataTable/styled";

export interface TableHeadProps<T> {
    table: Table<T>;
}

export const TableHead = <T,>(props: TableHeadProps<T>) => {
    return (
        <DataTableHead>
            {props.table.getHeaderGroups().map(headerGroup => (
                <DataTableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                        const isLastCell = index === headerGroup.headers.length - 1;

                        console.log("colSpan", header.colSpan, header.getSize());
                        return (
                            <TableHeadCell
                                key={header.id}
                                {...header.column.columnDef.meta}
                                colSpan={header.colSpan}
                                style={{ width: header.getSize() }}
                            >
                                {header.isPlaceholder ? null : (
                                    <ColumnHeaderWrapper
                                        onClick={header.column.getToggleSortingHandler()}
                                        sortable={header.column.getCanSort()}
                                        isLastCell={isLastCell}
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                        <ColumnDirection
                                            direction={header.column.getIsSorted() || undefined}
                                        />
                                        {isLastCell && (
                                            <ColumnSelector
                                                columns={props.table.getAllColumns()}
                                                headers={props.table.getFlatHeaders()}
                                            />
                                        )}
                                    </ColumnHeaderWrapper>
                                )}
                                {header.column.getCanResize() && (
                                    <Resizer
                                        onMouseDown={header.getResizeHandler()}
                                        onTouchStart={header.getResizeHandler()}
                                        isResizing={header.column.getIsResizing()}
                                    />
                                )}
                            </TableHeadCell>
                        );
                    })}
                </DataTableRow>
            ))}
        </DataTableHead>
    );
};
