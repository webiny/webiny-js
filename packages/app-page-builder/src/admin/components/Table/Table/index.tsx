import React, { forwardRef, useMemo, useState, useEffect } from "react";

import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import { FolderDialogDelete, FolderDialogUpdate } from "@webiny/app-aco";
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
import { statuses as statusLabels } from "~/admin/constants/pageStatusesLabels";
import { PbPageDataItem, PbPageDataStatus } from "~/types";
import { EntryDialogMove } from "@webiny/app-aco/components/Dialogs/DialogMove";
import { menuStyles } from "./styled";

interface Props {
    records: SearchRecordItem<PbPageDataItem>[];
    folders: FolderItem[];
    loading?: boolean;
    openPreviewDrawer: () => void;
    onSelectRow: (rows: Entry[] | []) => void;
    sorting: Sorting;
    onSortingChange: OnSortingChange;
}

interface Entry {
    id: string;
    type: "RECORD" | "FOLDER";
    title: string;
    createdBy: string;
    savedOn: string;
    status?: PbPageDataStatus;
    version?: number;
    original: PbPageDataItem | FolderItem;
    selectable: boolean;
}

export const Table = forwardRef<HTMLDivElement, Props>((props, ref) => {
    const { folders, records, loading, openPreviewDrawer, onSelectRow, sorting, onSortingChange } =
        props;

    const [data, setData] = useState<Entry[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    const [selectedSearchRecord, setSelectedSearchRecord] = useState<SearchRecordItem>();
    const [moveSearchRecordDialogOpen, setMoveSearchRecordDialogOpen] = useState<boolean>(false);

    const createRecordsData = useMemo(() => {
        return (items: SearchRecordItem<PbPageDataItem>[]): Entry[] =>
            items.map(({ data }) => ({
                id: data.id,
                type: "RECORD",
                title: data.title,
                createdBy: data.createdBy.displayName,
                savedOn: data.savedOn,
                status: data.status,
                version: data.version,
                original: data || {},
                selectable: true
            }));
    }, [records]);

    const createFoldersData = useMemo(() => {
        return (items: FolderItem[]): Entry[] =>
            items.map(item => ({
                id: item.id,
                type: "FOLDER",
                title: item.title,
                createdBy: item.createdBy.displayName || "-",
                savedOn: item.createdOn,
                original: item,
                selectable: false
            }));
    }, [folders]);

    useEffect(() => {
        const foldersData = createFoldersData(folders);
        const pagesData = createRecordsData(records);
        setData([...foldersData, ...pagesData]);
    }, [folders, records]);

    const columns: Columns<Entry> = {
        title: {
            header: "Name",
            cell: ({ id, title, type }) => {
                if (type === "RECORD") {
                    return <PageName name={title} id={id} onClick={openPreviewDrawer} />;
                } else {
                    return <FolderName name={title} id={id} />;
                }
            },
            enableSorting: true
        },
        savedOn: {
            header: "Last modified",
            cell: ({ savedOn }) => <TimeAgo datetime={savedOn} />,
            enableSorting: true
        },
        createdBy: {
            header: "Author"
        },
        status: {
            header: "Status",
            cell: ({ status, version }) => {
                if (status && version) {
                    return `${statusLabels[status]} (v${version})`;
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
            cell: ({ type, original }) => {
                if (!original) {
                    return <></>;
                }

                if (type === "RECORD") {
                    return (
                        <Menu className={menuStyles} handle={<IconButton icon={<More />} />}>
                            <RecordActionEdit record={original as PbPageDataItem} />
                            <RecordActionPreview record={original as PbPageDataItem} />
                            <RecordActionPublish record={original as PbPageDataItem} />
                            <RecordActionMove
                                onClick={() => {
                                    setMoveSearchRecordDialogOpen(true);
                                    setSelectedSearchRecord(() =>
                                        records.find(
                                            record => record.id === (original as PbPageDataItem).pid
                                        )
                                    );
                                }}
                            />
                            <RecordActionDelete record={original as PbPageDataItem} />
                        </Menu>
                    );
                } else {
                    return (
                        <Menu handle={<IconButton icon={<More />} />}>
                            <FolderActionEdit
                                onClick={() => {
                                    setUpdateDialogOpen(true);
                                    setSelectedFolder(original as FolderItem);
                                }}
                            />
                            <FolderActionDelete
                                onClick={() => {
                                    setDeleteDialogOpen(true);
                                    setSelectedFolder(original as FolderItem);
                                }}
                            />
                        </Menu>
                    );
                }
            }
        }
    };

    return (
        <div ref={ref}>
            <DataTable
                columns={columns}
                data={data}
                loadingInitial={loading}
                stickyRows={1}
                onSelectRow={onSelectRow}
                sorting={sorting}
                onSortingChange={onSortingChange}
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
