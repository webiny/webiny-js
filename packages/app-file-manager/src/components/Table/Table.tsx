import React, { forwardRef, useMemo, useState } from "react";
import { ReactComponent as MoreIcon } from "@material-design-icons/svg/filled/more_vert.svg";
import {
    FolderDialogDelete,
    FolderDialogManagePermissions,
    FolderDialogUpdate
} from "@webiny/app-aco";
import { FolderItem, Location } from "@webiny/app-aco/types";
import { IconButton } from "@webiny/ui/Button";
import { Columns, DataTable, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { Menu } from "@webiny/ui/Menu";
import bytes from "bytes";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { FileName, FolderName } from "./Name";
import { FolderActionDelete } from "./FolderActionDelete";
import { FolderActionEdit } from "./FolderActionEdit";
import { FolderActionManagePermissions } from "./FolderActionManagePermissions";
import { RecordActionCopy } from "./RecordActionCopy";
import { RecordActionDelete } from "./RecordActionDelete";
import { RecordActionEdit } from "./RecordActionEdit";
import { RecordActionMove } from "./RecordActionMove";
import { menuStyles } from "./styled";
import { FileItem } from "@webiny/app-admin/types";
import { Settings } from "~/types";
import { FileProvider } from "~/contexts/FileProvider";

export interface TableProps {
    records: FileItem[];
    folders: FolderItem[];
    selectedRecords: FileItem[];
    loading?: boolean;
    onRecordClick: (id: string) => void;
    onFolderClick: (id: string) => void;
    onSelectRow: ((rows: Entry[] | []) => void) | undefined;
    onToggleRow: ((row: Entry) => void) | undefined;
    sorting: Sorting;
    onSortingChange: OnSortingChange;
    settings?: Settings;
}

interface BaseEntry {
    $selectable: boolean;
    id: string;
    createdBy: string;
    createdOn: string;
    savedOn: string;
}

interface FileEntry extends BaseEntry {
    $type: "RECORD";
    name: string;
    type: string;
    size: number;
    original: FileItem;
    location: Location;
}

interface FolderEntry extends BaseEntry {
    $type: "FOLDER";
    title: string;
    original: FolderItem;
}

export type Entry = FolderEntry | FileEntry;

const createRecordsData = (items: FileItem[]): FileEntry[] => {
    return items.map(data => {
        return {
            $type: "RECORD",
            $selectable: true, // Files a.k.a. records are always selectable to perform bulk actions
            id: data.id,
            name: data.name,
            createdBy: data.createdBy?.displayName || "-",
            createdOn: data.createdOn,
            savedOn: data.savedOn,
            type: data.type,
            size: data.size,
            original: data || {},
            location: data.location
        };
    });
};

const createFoldersData = (items: FolderItem[]): FolderEntry[] => {
    return items.map(item => ({
        $type: "FOLDER",
        $selectable: false,
        id: item.id,
        title: item.title,
        createdBy: item.createdBy?.displayName || "-",
        createdOn: item.createdOn,
        savedOn: item.savedOn,
        original: item
    }));
};

function isFileEntry(entry: Entry): entry is FileEntry {
    return entry.$type === "RECORD";
}

export const Table = forwardRef<HTMLDivElement, TableProps>((props, ref) => {
    const {
        folders,
        records,
        selectedRecords,
        onSelectRow,
        onToggleRow,
        loading,
        onRecordClick,
        onFolderClick,
        sorting,
        onSortingChange
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
            name: {
                header: "Name",
                enableSorting: true,
                size: 400,
                cell: (item: Entry) => {
                    if (isFileEntry(item)) {
                        return (
                            <FileName
                                name={item.name}
                                id={item.id}
                                type={item.type}
                                onClick={onRecordClick}
                            />
                        );
                    }

                    const { hasNonInheritedPermissions, canManagePermissions } = item.original;

                    return (
                        <FolderName
                            name={item.title}
                            id={item.id}
                            onClick={onFolderClick}
                            canManagePermissions={canManagePermissions}
                            hasNonInheritedPermissions={hasNonInheritedPermissions}
                        />
                    );
                }
            },
            type: {
                header: "Type",
                cell: (item: Entry) => {
                    if (isFileEntry(item)) {
                        return item.type;
                    }
                    return "-";
                }
            },
            size: {
                header: "Size",
                enableSorting: true,
                cell: (item: Entry) => {
                    if (isFileEntry(item)) {
                        return bytes.format(item.size, { unitSeparator: " " });
                    }
                    return "-";
                }
            },
            createdBy: {
                header: "Author"
            },
            savedOn: {
                header: "Modified",
                cell: ({ savedOn }: Entry) => <TimeAgo datetime={savedOn} />,
                enableSorting: true
            },
            original: {
                header: "",
                meta: {
                    alignEnd: true
                },
                size: 60,
                enableResizing: false,
                cell: (item: Entry) => {
                    if (!item.original) {
                        return <></>;
                    } else if (isFileEntry(item)) {
                        const { original } = item;
                        return (
                            <FileProvider file={original}>
                                <Menu
                                    className={menuStyles}
                                    handle={<IconButton icon={<MoreIcon />} />}
                                >
                                    <RecordActionCopy record={original} />
                                    <RecordActionEdit id={original.id} onClick={onRecordClick} />
                                    <RecordActionMove />
                                    <RecordActionDelete record={original} />
                                </Menu>
                            </FileProvider>
                        );
                    }

                    const { original } = item;

                    return (
                        <Menu handle={<IconButton icon={<MoreIcon />} />}>
                            <FolderActionEdit
                                onClick={() => {
                                    setUpdateDialogOpen(true);
                                    setSelectedFolder(original);
                                }}
                            />
                            {original.canManagePermissions && (
                                <FolderActionManagePermissions
                                    onClick={() => {
                                        setManagePermissionsDialogOpen(true);
                                        setSelectedFolder(original);
                                    }}
                                />
                            )}
                            <FolderActionDelete
                                onClick={() => {
                                    setDeleteDialogOpen(true);
                                    setSelectedFolder(original);
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
                onToggleRow={onToggleRow}
                isRowSelectable={row => row.original.$selectable}
                sorting={sorting}
                initialSorting={[
                    {
                        id: "createdOn",
                        desc: true
                    }
                ]}
                onSortingChange={onSortingChange}
                selectedRows={createRecordsData(selectedRecords)}
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
