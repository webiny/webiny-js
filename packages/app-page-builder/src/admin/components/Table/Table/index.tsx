import React, { forwardRef, useMemo, useState } from "react";
import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import {
    FolderDialogDelete,
    FolderDialogUpdate,
    FolderDialogManagePermissions
} from "@webiny/app-aco";
import { FolderItem, Location, SearchRecordItem } from "@webiny/app-aco/types";
import { IconButton } from "@webiny/ui/Button";
import { Columns, DataTable, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { Menu } from "@webiny/ui/Menu";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import { FolderName, PageName } from "./Row/Name";
import { FolderActionDelete } from "./Row/Folder/FolderActionDelete";
import { FolderActionEdit } from "./Row/Folder/FolderActionEdit";
import { FolderActionManagePermissions } from "./Row/Folder/FolderActionManagePermissions";
import { RecordActionDelete } from "./Row/Record/RecordActionDelete";
import { RecordActionEdit } from "./Row/Record/RecordActionEdit";
import { RecordActionMove } from "./Row/Record/RecordActionMove";
import { RecordActionPreview } from "./Row/Record/RecordActionPreview";
import { RecordActionPublish } from "./Row/Record/RecordActionPublish";
import { statuses as statusLabels } from "~/admin/constants";
import { PbPageDataItem, PbPageDataStatus } from "~/types";
import { menuStyles } from "./styled";

export interface TableProps {
    records: SearchRecordItem<PbPageDataItem>[];
    folders: FolderItem[];
    loading?: boolean;
    openPreviewDrawer: () => void;
    onSelectRow: (rows: Entry[] | []) => void;
    selectedRows: PbPageDataItem[];
    sorting: Sorting;
    onSortingChange: OnSortingChange;
}

interface BaseEntry {
    $selectable: boolean;
    id: string;
    title: string;
    createdBy: string;
    createdOn: string;
    savedOn: string;
}

export interface PageEntry extends BaseEntry {
    $type: "RECORD";
    original: PbPageDataItem;
    status: PbPageDataStatus;
    location: Location;
    version?: number;
}

interface FolderEntry extends BaseEntry {
    $type: "FOLDER";
    original: FolderItem;
}

type Entry = PageEntry | FolderEntry;

const createRecordsData = (items: SearchRecordItem<PbPageDataItem>[]): PageEntry[] => {
    return items.map(({ data, location }) => {
        return {
            $type: "RECORD",
            $selectable: true,
            id: data.pid,
            title: data.title,
            createdBy: data.createdBy?.displayName || "-",
            createdOn: data.createdOn,
            savedOn: data.savedOn,
            status: data.status,
            version: data.version,
            original: data || {},
            location: location
        };
    });
};

const createFoldersData = (items: FolderItem[]): FolderEntry[] => {
    return items.map(item => {
        return {
            $type: "FOLDER",
            $selectable: false,
            id: item.id,
            title: item.title,
            createdBy: item.createdBy?.displayName || "-",
            createdOn: item.createdOn,
            savedOn: item.createdOn,
            original: item
        };
    });
};

export const isPageEntry = (entry: Entry): entry is PageEntry => {
    return entry.$type === "RECORD";
};

export const Table = forwardRef<HTMLDivElement, TableProps>((props, ref) => {
    const {
        folders,
        records,
        loading,
        openPreviewDrawer,
        onSelectRow,
        sorting,
        onSortingChange,
        selectedRows
    } = props;
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [managePermissionsDialogOpen, setManagePermissionsDialogOpen] = useState<boolean>(false);

    const data = useMemo<Entry[]>(() => {
        return [...createFoldersData(folders), ...createRecordsData(records)];
    }, [folders, records]);

    const columns: Columns<Entry> = useMemo(() => {
        return {
            title: {
                header: "Name",
                cell: (entry: Entry) => {
                    if (isPageEntry(entry)) {
                        return (
                            <PageName
                                name={entry.title}
                                id={entry.id}
                                onClick={openPreviewDrawer}
                            />
                        );
                    }

                    return (
                        <FolderName
                            name={entry.title}
                            id={entry.id}
                            canManagePermissions={entry.original.canManagePermissions}
                            hasNonInheritedPermissions={entry.original.hasNonInheritedPermissions}
                        />
                    );
                },
                enableSorting: true,
                size: 400
            },
            createdBy: {
                header: "Author"
            },
            savedOn: {
                header: "Modified",
                cell: ({ savedOn }: Entry) => <TimeAgo datetime={savedOn} />,
                enableSorting: true
            },
            status: {
                header: "Status",
                cell: (entry: Entry) => {
                    if (isPageEntry(entry)) {
                        const { status, version } = entry;
                        return `${statusLabels[status]}${version ? ` (v${version})` : ""}`;
                    }
                    return "-";
                }
            },
            original: {
                header: "",
                meta: {
                    alignEnd: true
                },
                size: 60,
                enableResizing: false,
                cell: (entry: Entry) => {
                    if (isPageEntry(entry)) {
                        return (
                            <Menu className={menuStyles} handle={<IconButton icon={<More />} />}>
                                <RecordActionEdit record={entry.original} />
                                <RecordActionPreview record={entry.original} />
                                <RecordActionPublish record={entry.original} />
                                <RecordActionMove record={entry} />
                                <RecordActionDelete record={entry.original} />
                            </Menu>
                        );
                    }

                    // If the user cannot manage folder structure, no need to show the menu.
                    if (!entry.original.canManageStructure) {
                        return null;
                    }

                    return (
                        <Menu handle={<IconButton icon={<More />} />}>
                            <FolderActionEdit
                                onClick={() => {
                                    setUpdateDialogOpen(true);
                                    setSelectedFolder(entry.original);
                                }}
                            />

                            {entry.original.canManagePermissions && (
                                <FolderActionManagePermissions
                                    onClick={() => {
                                        setManagePermissionsDialogOpen(true);
                                        setSelectedFolder(entry.original);
                                    }}
                                />
                            )}

                            <FolderActionDelete
                                onClick={() => {
                                    setDeleteDialogOpen(true);
                                    setSelectedFolder(entry.original);
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
                loadingInitial={loading}
                stickyRows={1}
                onSelectRow={onSelectRow}
                sorting={sorting}
                selectedRows={data.filter(record =>
                    selectedRows.find(row => row.pid === record.id)
                )}
                isRowSelectable={row => row.original.$selectable}
                onSortingChange={onSortingChange}
                initialSorting={[
                    {
                        id: "createdOn",
                        desc: true
                    }
                ]}
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
                    />{" "}
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
