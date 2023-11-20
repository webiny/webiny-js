import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import {
    FolderDialogDelete,
    FolderDialogUpdate,
    FolderDialogManagePermissions,
    useNavigateFolder
} from "@webiny/app-aco";
import { FolderItem } from "@webiny/app-aco/types";
import { IconButton } from "@webiny/ui/Button";
import { Columns, DataTable, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { Menu } from "@webiny/ui/Menu";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { EntryName, FolderName } from "./Row/Name";
import { FolderActionDelete } from "./Row/Folder/FolderActionDelete";
import { FolderActionEdit } from "./Row/Folder/FolderActionEdit";
import { FolderActionManagePermissions } from "./Row/Folder/FolderActionManagePermissions";
import { RecordActionDelete } from "./Row/Record/RecordActionDelete";
import { RecordActionEdit } from "./Row/Record/RecordActionEdit";
import { RecordActionMove } from "./Row/Record/RecordActionMove";
import { RecordActionPublish } from "./Row/Record/RecordActionPublish";
import { menuStyles } from "./styled";
import { Entry, FolderEntry, RecordEntry } from "./types";
import { useRouter } from "@webiny/react-router";
import { useModel, usePermission } from "~/admin/hooks";
import { CreatableItem } from "~/admin/hooks/usePermission";
import { statuses as statusLabels } from "~/admin/constants/statusLabels";
import { isRecordEntry } from "~/utils/acoRecordTransform";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";

export interface TableProps {
    folders: FolderEntry[];
    loading?: boolean;
    onSelectRow: (rows: Entry[] | []) => void;
    onSortingChange: OnSortingChange;
    records: RecordEntry[];
    selectedRows: CmsContentEntry[];
    sorting: Sorting;
}

export const Table = forwardRef<HTMLDivElement, TableProps>((props, ref) => {
    const { currentFolderId } = useNavigateFolder();
    const { folders, records, loading, sorting, onSortingChange, selectedRows, onSelectRow } =
        props;
    const { model } = useModel();

    const { history } = useRouter();
    const { canEdit: baseCanEdit } = usePermission();

    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [managePermissionsDialogOpen, setManagePermissionsDialogOpen] = useState<boolean>(false);

    const data = useMemo<Entry[]>(() => {
        return (folders as Entry[]).concat(records as Entry[]);
    }, [folders, records]);

    const canEdit = useCallback(
        (entry: CreatableItem) => {
            return baseCanEdit(entry, "cms.contentEntry");
        },
        [baseCanEdit]
    );
    const createEditEntry = useCallback(
        (entry: CreatableItem & Pick<Entry, "id">) => {
            if (!canEdit(entry)) {
                return undefined;
            }
            return () => {
                const folderPath = currentFolderId
                    ? `&folderId=${encodeURIComponent(currentFolderId)}`
                    : "";
                history.push(
                    `/cms/content-entries/${model.modelId}?id=${encodeURIComponent(
                        entry.id
                    )}${folderPath}`
                );
            };
        },
        [canEdit, model.modelId, currentFolderId]
    );

    const columns: Columns<Entry> = useMemo(() => {
        const titleColumnId = model.titleFieldId || "id";

        return {
            [titleColumnId]: {
                header: "Name",
                className: "cms-aco-list-title",
                cell: (record: Entry) => {
                    if (isRecordEntry(record)) {
                        return (
                            <EntryName record={record} onClick={createEditEntry(record.original)} />
                        );
                    }
                    return <FolderName record={record} />;
                },
                enableSorting: true,
                size: 400
            },
            createdBy: {
                header: "Author",
                className: "cms-aco-list-createdBy"
            },
            savedOn: {
                header: "Modified",
                className: "cms-aco-list-savedOn",
                cell: ({ savedOn }: Entry) => <TimeAgo datetime={savedOn} />,
                enableSorting: true
            },
            status: {
                header: "Status",
                className: "cms-aco-list-status",
                cell: ({ status, version }: Entry) => {
                    if (status && version) {
                        return `${statusLabels[status as keyof typeof statusLabels]} (v${version})`;
                    } else {
                        return "-";
                    }
                }
            },
            original: {
                header: "",
                meta: {
                    alignEnd: true
                },
                size: 60,
                enableResizing: false,
                cell: (record: Entry) => {
                    if (isRecordEntry(record)) {
                        return (
                            <Menu
                                className={`${menuStyles} record-menu`}
                                handle={<IconButton icon={<More />} />}
                            >
                                <RecordActionEdit
                                    record={record}
                                    onClick={createEditEntry(record.original)}
                                    canEdit={canEdit}
                                />
                                <RecordActionPublish record={record} />
                                <RecordActionMove record={record} />
                                <RecordActionDelete record={record} />
                            </Menu>
                        );
                    }

                    // If the user cannot manage folder structure, no need to show the menu.
                    if (!record.original.canManageStructure) {
                        return null;
                    }

                    return (
                        <Menu handle={<IconButton icon={<More />} />}>
                            <FolderActionEdit
                                onClick={() => {
                                    setUpdateDialogOpen(true);
                                    setSelectedFolder(record.original);
                                }}
                            />
                            {record.original.canManagePermissions && (
                                <FolderActionManagePermissions
                                    onClick={() => {
                                        setManagePermissionsDialogOpen(true);
                                        setSelectedFolder(record.original);
                                    }}
                                />
                            )}
                            <FolderActionDelete
                                onClick={() => {
                                    setDeleteDialogOpen(true);
                                    setSelectedFolder(record.original);
                                }}
                            />
                        </Menu>
                    );
                }
            }
        };
    }, []);

    return (
        <div ref={ref}>
            <DataTable<Entry>
                columns={columns}
                data={data}
                isRowSelectable={row => row.original.$selectable}
                loadingInitial={loading}
                stickyRows={1}
                sorting={sorting}
                initialSorting={[
                    {
                        id: "createdOn",
                        desc: true
                    }
                ]}
                onSelectRow={onSelectRow}
                onSortingChange={onSortingChange}
                selectedRows={data.filter(record => selectedRows.find(row => row.id === record.id))}
            />
            {selectedFolder && (
                <>
                    <FolderDialogUpdate
                        folder={selectedFolder}
                        open={updateDialogOpen}
                        onClose={() => setUpdateDialogOpen(false)}
                    />
                    <FolderDialogManagePermissions
                        folder={selectedFolder}
                        open={managePermissionsDialogOpen}
                        onClose={() => setManagePermissionsDialogOpen(false)}
                    />
                    <FolderDialogDelete
                        folder={selectedFolder}
                        open={deleteDialogOpen}
                        onClose={() => setDeleteDialogOpen(false)}
                    />
                </>
            )}
        </div>
    );
});

Table.displayName = "Table";
