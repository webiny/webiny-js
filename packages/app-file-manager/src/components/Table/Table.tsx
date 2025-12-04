import React, { forwardRef, useMemo } from "react";
import type { DataTableSorting, OnDataTableSortingChange } from "@webiny/admin-ui";
import { createFoldersData, createRecordsData, Table as AcoTable } from "@webiny/app-aco";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider/index.js";
import type { TableItem } from "~/types.js";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";

export interface TableProps {
    onSelectRow: ((rows: TableItem[] | []) => void) | undefined;
    onToggleRow: ((row: TableItem) => void) | undefined;
    sorting: DataTableSorting;
    onSortingChange: OnDataTableSortingChange;
}

export const Table = forwardRef<HTMLDivElement, TableProps>((props, ref) => {
    const view = useFileManagerView();
    const { browser } = useFileManagerViewConfig()

    const data = useMemo<TableItem[]>(() => {
        if (!view.displaySubFolders) {
            return createRecordsData(view.files);
        }
        return [...createFoldersData(view.folders), ...createRecordsData(view.files)];
    }, [view.folders, view.files, view.displaySubFolders]);

    const selected = useMemo<TableItem[]>(() => {
        return createRecordsData(view.selected);
    }, [view.selected]);

    return (
        <div ref={ref}>
            <AcoTable<TableItem>
                columns={browser.table.columns}
                data={data}
                loading={view.isListLoading}
                onSelectRow={props.onSelectRow}
                onToggleRow={props.onToggleRow}
                sorting={props.sorting}
                onSortingChange={props.onSortingChange}
                selected={selected}
                namespace={"fm.file"}
            />
        </div>
    );
});

Table.displayName = "Table";
