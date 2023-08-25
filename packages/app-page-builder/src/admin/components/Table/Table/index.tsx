import React, { forwardRef, useMemo, useState } from "react";
import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import { EntryDialogMove, FolderDialogDelete, FolderDialogUpdate } from "@webiny/app-aco";
import { FolderItem, SearchRecordItem } from "@webiny/app-aco/types";
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
import { RecordActionDelete } from "./Row/Record/RecordActionDelete";
import { RecordActionEdit } from "./Row/Record/RecordActionEdit";
import { RecordActionMove } from "./Row/Record/RecordActionMove";
import { RecordActionPreview } from "./Row/Record/RecordActionPreview";
import { RecordActionPublish } from "./Row/Record/RecordActionPublish";
import { statuses as statusLabels } from "~/admin/constants";
import { PbPageDataItem, PbPageDataStatus } from "~/types";
import { actionsColumnStyles, menuStyles } from "./styled";

export interface TableProps {
    records: SearchRecordItem<PbPageDataItem>[];
    folders: FolderItem[];
    loading?: boolean;
    openPreviewDrawer: () => void;
    onSelectRow: (rows: Entry[] | []) => void;
    selectedRows: string[];
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

interface PageEntry extends BaseEntry {
    $type: "RECORD";
    original: PbPageDataItem;
    status: PbPageDataStatus;
    version?: number;
}

interface FolderEntry extends BaseEntry {
    $type: "FOLDER";
    original: FolderItem;
}

type Entry = PageEntry | FolderEntry;

const createRecordsData = (items: SearchRecordItem<PbPageDataItem>[]): PageEntry[] => {
    return items.map(({ data }) => {
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
            original: data || {}
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

function isPageEntry(entry: Entry): entry is PageEntry {
    return entry.$type === "RECORD";
}

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

    const [selectedSearchRecord, setSelectedSearchRecord] = useState<SearchRecordItem>();
    const [moveSearchRecordDialogOpen, setMoveSearchRecordDialogOpen] = useState<boolean>(false);

    const data = useMemo<Entry[]>(() => {
        return [...createFoldersData(folders), ...createRecordsData(records)];
    }, [folders, records]);

    const columns: Columns<Entry> = {
        title: {
            header: "Name",
            cell: (entry: Entry) => {
                if (isPageEntry(entry)) {
                    return (
                        <PageName name={entry.title} id={entry.id} onClick={openPreviewDrawer} />
                    );
                }
                return <FolderName name={entry.title} id={entry.id} />;
            },
            enableSorting: true
        },
        createdOn: {
            header: "Created",
            cell: ({ createdOn }: Entry) => <TimeAgo datetime={createdOn} />,
            enableSorting: true
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
            className: actionsColumnStyles,
            cell: (entry: Entry) => {
                if (isPageEntry(entry)) {
                    return (
                        <Menu className={menuStyles} handle={<IconButton icon={<More />} />}>
                            <RecordActionEdit record={entry.original} />
                            <RecordActionPreview record={entry.original} />
                            <RecordActionPublish record={entry.original} />
                            <RecordActionMove
                                onClick={() => {
                                    setMoveSearchRecordDialogOpen(true);
                                    setSelectedSearchRecord(() =>
                                        records.find(
                                            record => record.data.pid === entry.original.pid
                                        )
                                    );
                                }}
                            />
                            <RecordActionDelete record={entry.original} />
                        </Menu>
                    );
                }

                return (
                    <Menu handle={<IconButton icon={<More />} />}>
                        <FolderActionEdit
                            onClick={() => {
                                setUpdateDialogOpen(true);
                                setSelectedFolder(entry.original);
                            }}
                        />
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

    return (
        <div ref={ref}>
            <DataTable<Entry>
                columns={columns}
                data={data}
                loadingInitial={loading}
                stickyRows={1}
                onSelectRow={onSelectRow}
                sorting={sorting}
                selectedRows={data.filter(record => selectedRows.includes(record.id))}
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
                    <FolderDialogDelete
                        folder={selectedFolder}
                        open={deleteDialogOpen}
                        onClose={() => setDeleteDialogOpen(false)}
                    />
                </>
            )}
            {selectedSearchRecord && (
                <EntryDialogMove
                    searchRecord={selectedSearchRecord}
                    open={moveSearchRecordDialogOpen}
                    onClose={() => setMoveSearchRecordDialogOpen(false)}
                />
            )}
        </div>
    );
});

Table.displayName = "Table";
