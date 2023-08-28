import React, { forwardRef, useMemo, useState } from "react";
import { ReactComponent as MoreIcon } from "@material-design-icons/svg/filled/more_vert.svg";
import { FolderDialogDelete, FolderDialogUpdate } from "@webiny/app-aco";
import { FolderItem, Location } from "@webiny/app-aco/types";
import { IconButton } from "@webiny/ui/Button";
import { Columns, DataTable, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { Menu } from "@webiny/ui/Menu";
import bytes from "bytes";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import { FileName, FolderName } from "./Name";
import { FolderActionDelete } from "./FolderActionDelete";
import { FolderActionEdit } from "./FolderActionEdit";
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
    sorting: Sorting;
    onSortingChange: OnSortingChange;
    settings?: Settings;
    selectableItems: boolean;
    canSelectAllRows: boolean;
}

type FileEntry = {
    $type: "RECORD";
    $selectable: boolean;
    id: string;
    name: string;
    createdBy: string;
    savedOn: string;
    type: string;
    size: number;
    original: FileItem;
    location: Location;
};

type FolderEntry = {
    $type: "FOLDER";
    $selectable: boolean;
    id: string;
    title: string;
    createdBy: string;
    savedOn: string;
    original: FolderItem;
};

type Entry = FolderEntry | FileEntry;

const createRecordsData = (items: FileItem[], selectable: boolean): FileEntry[] => {
    return items.map(data => {
        return {
            $type: "RECORD",
            $selectable: selectable,
            id: data.id,
            name: data.name,
            createdBy: data.createdBy?.displayName || "-",
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
        loading,
        onRecordClick,
        onFolderClick,
        sorting,
        onSortingChange,
        selectableItems,
        canSelectAllRows
    } = props;

    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    const data = useMemo<Entry[]>(() => {
        return [...createFoldersData(folders), ...createRecordsData(records, selectableItems)];
    }, [folders, records]);

    const columns: Columns<Entry> = {
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
                return <FolderName name={item.title} id={item.id} onClick={onFolderClick} />;
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
        savedOn: {
            header: "Last modified",
            cell: ({ savedOn }: Entry) => <TimeAgo datetime={savedOn} />,
            enableSorting: true
        },
        createdBy: {
            header: "Author"
        },
        original: {
            header: "",
            meta: {
                alignEnd: true
            },
            size: 60,
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

    return (
        <div ref={ref}>
            <DataTable<Entry>
                canSelectAllRows={canSelectAllRows}
                columns={columns}
                data={data}
                loadingInitial={loading}
                stickyRows={1}
                onSelectRow={onSelectRow}
                isRowSelectable={row => row.original.$selectable}
                sorting={sorting}
                onSortingChange={onSortingChange}
                selectedRows={createRecordsData(selectedRecords, true)}
            />
            {selectedFolder && (
                <>
                    <FolderDialogUpdate
                        folder={selectedFolder}
                        open={updateDialogOpen}
                        onClose={() => setUpdateDialogOpen(false)}
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
