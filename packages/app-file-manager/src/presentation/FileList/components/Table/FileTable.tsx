import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import type { DataTableSorting, OnDataTableSortingChange } from "@webiny/admin-ui";
import { createRecordsData, Table as AcoTable } from "@webiny/app-aco";
import type { FolderTableRow, RecordTableRow } from "@webiny/app-aco";
import { useFileListPresenter } from "../../FileListPresenterProvider.js";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import type { FmFile } from "~/features/shared/types.js";
import type { IFolderTreeNode } from "@webiny/app-aco/presentation/folderTree/abstractions.js";

export type FileTableItem = FolderTableRow | RecordTableRow<FmFile>;

/**
 * Map IFolderTreeNode to a FolderDto-compatible shape for the ACO table.
 */
const toFolderTableRows = (nodes: IFolderTreeNode[]): FolderTableRow[] => {
    return nodes.map(node => ({
        id: node.id,
        $type: "FOLDER" as const,
        $selectable: false,
        data: {
            id: node.id,
            title: node.name,
            slug: node.slug,
            type: "",
            parentId: node.parentId,
            path: "",
            permissions: [],
            hasNonInheritedPermissions: false,
            canManagePermissions: false,
            canManageStructure: false,
            canManageContent: false,
            createdBy: { id: "", displayName: "", type: "" },
            createdOn: "",
            savedBy: { id: "", displayName: "", type: "" },
            savedOn: "",
            modifiedBy: null,
            modifiedOn: null,
            extensions: {}
        }
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
    const presenter = useFileListPresenter();
    const { browser } = useFileManagerViewConfig();
    const { vm, actions } = presenter;

    // Build table data: folder rows above file rows.
    const data = useMemo<FileTableItem[]>(() => {
        const currentFolder = vm.folders.currentFolder;
        const childFolders = currentFolder ? currentFolder.children : vm.folders.tree;
        const folderRows = toFolderTableRows(childFolders);
        const fileRows = createRecordsData(vm.list.rows);
        return [...folderRows, ...fileRows];
    }, [vm.folders.currentFolder, vm.folders.tree, vm.list.rows]);

    // Build selected rows for the DataTable.
    const selected = useMemo<FileTableItem[]>(() => {
        const selectedFiles = vm.list.rows.filter(file =>
            vm.list.selection.selectedIds.has(file.id)
        );
        return createRecordsData(selectedFiles);
    }, [vm.list.rows, vm.list.selection.selectedIds]);

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

    // Handle row toggle (single row checkbox click).
    const onToggleRow = useCallback(
        (row: FileTableItem) => {
            if (row.$type === "RECORD") {
                actions.selection.toggle(row.id);
            }
        },
        [actions.selection]
    );

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
