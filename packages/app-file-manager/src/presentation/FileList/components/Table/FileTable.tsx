import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import type { DataTableSorting, OnDataTableSortingChange } from "@webiny/admin-ui";
import { useShiftKey } from "@webiny/app-admin";
import { useOverlay } from "~/presentation/FileManager/OverlayContext.js";
import { createRecordsData, Table as AcoTable } from "@webiny/app-aco";
import type { FolderTableRow, RecordTableRow } from "@webiny/app-aco";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";
import { useFileManagerConfig } from "~/presentation/config/FileManagerViewConfig.js";
import type { FmFile } from "~/features/shared/types.js";
import type { FolderDto } from "@webiny/app-aco";

export type FileTableItem = FolderTableRow | RecordTableRow<FmFile>;

const toFolderTableRows = (folders: FolderDto[]): FolderTableRow[] => {
    return folders.map(folder => ({
        id: folder.id,
        $type: "FOLDER" as const,
        $selectable: false,
        data: folder
    }));
};

/**
 * Convert presenter sort state to DataTable sorting format.
 */
const toDataTableSorting = (
    sort: { field: string; direction: "ASC" | "DESC" } | null
): DataTableSorting => {
    if (!sort) {
        return [];
    }
    return [{ id: sort.field, desc: sort.direction === "DESC" }];
};

/**
 * Table View component driven by FileListPresenter vm.
 * Bridges the presenter's state to the ACO Table component,
 * wiring sort and selection actions back to the presenter.
 */
export const FileTable = observer(function FileTable() {
    const presenter = useFileManagerPresenter();
    const { browser } = useFileManagerConfig();
    const { vm, actions } = presenter;

    const { isPressed: isShiftPressed } = useShiftKey();
    const overlay = useOverlay();

    // No useMemo — MobX observer needs to track these observable accesses during render.
    const fileRows = createRecordsData(vm.list.rows);
    const data: FileTableItem[] = vm.showFolders
        ? [...toFolderTableRows(vm.childFolders), ...fileRows]
        : fileRows;

    const selected: FileTableItem[] = createRecordsData(
        vm.list.rows.filter(file => vm.list.selection.selectedIds.has(file.id))
    );

    // Convert presenter sort state to DataTable format.
    const sorting = useMemo(() => toDataTableSorting(vm.list.sort), [vm.list.sort]);

    // Handle sorting changes from the DataTable.
    const onSortingChange: OnDataTableSortingChange = useCallback(
        updater => {
            const newSorting = typeof updater === "function" ? updater(sorting) : updater;
            if (newSorting.length > 0) {
                const { id, desc } = newSorting[0];
                actions.sort.set(id, desc ? "DESC" : "ASC");
            }
        },
        [sorting, actions.sort]
    );

    const onToggleRow = (row: FileTableItem) => {
        if (row.$type !== "RECORD") {
            return;
        }

        if (isShiftPressed()) {
            actions.selection.selectRangeTo(row.id);
            return;
        }

        if (overlay) {
            const file = vm.list.rows.find(f => f.id === row.id);
            if (file) {
                overlay.onFileClick(file);
            }
            return;
        }

        actions.selection.toggle(row.id);
    };

    // Handle select all / bulk selection.
    const onSelectRow = useCallback(
        (rows: FileTableItem[] | []) => {
            if (rows.length === 0) {
                actions.selection.deselectAll();
                return;
            }
            const ids = rows
                .filter((row): row is RecordTableRow<FmFile> => row.$type === "RECORD")
                .map(row => row.id);
            actions.selection.selectRows(ids);
        },
        [actions.selection]
    );

    return (
        <AcoTable<FileTableItem>
            columns={browser.table.columns}
            data={data}
            loading={vm.list.pagination.loading}
            onSelectRow={onSelectRow}
            onToggleRow={onToggleRow}
            sorting={sorting}
            onSortingChange={onSortingChange}
            selected={selected}
            namespace={"fm/file/list"}
        />
    );
});
