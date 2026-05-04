import React, { forwardRef, useMemo } from "react";
import type { DataTableSorting, OnDataTableSortingChange } from "@webiny/admin-ui";
import { createRecordsData, Table as AcoTable } from "@webiny/app-aco";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import type { TableItem } from "~/types.js";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import { toFolderDto } from "~/presentation/adapters/toFolderDto.js";
import { createFoldersData } from "@webiny/app-aco";

export interface TableProps {
    onSelectRow: ((rows: TableItem[] | []) => void) | undefined;
    onToggleRow: ((row: TableItem) => void) | undefined;
    sorting: DataTableSorting;
    onSortingChange: OnDataTableSortingChange;
}

export const Table = forwardRef<HTMLDivElement, TableProps>((props, ref) => {
    const { vm } = useFileManagerPresenter();
    const { browser } = useFileManagerViewConfig();

    const data = useMemo<TableItem[]>(() => {
        const folderDtos = vm.folders.childFolders.map(toFolderDto);
        return [...createFoldersData(folderDtos), ...createRecordsData(vm.list.rows)];
    }, [vm.folders.childFolders, vm.list.rows]);

    const selected = useMemo<TableItem[]>(() => {
        const selectedFiles = vm.list.rows.filter(f => vm.list.selection.selectedIds.has(f.id));
        return createRecordsData(selectedFiles);
    }, [vm.list.rows, vm.list.selection.selectedIds]);

    return (
        <div ref={ref}>
            <AcoTable<TableItem>
                columns={browser.table.columns}
                data={data}
                loading={vm.list.pagination.loading}
                onSelectRow={props.onSelectRow}
                onToggleRow={props.onToggleRow}
                sorting={props.sorting}
                onSortingChange={props.onSortingChange}
                selected={selected}
                namespace={"fm/file/list"}
            />
        </div>
    );
});

Table.displayName = "Table";
