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
import { PbPageDataItem } from "~/types";
import { actionsColumnStyles, menuStyles } from "./styled";

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
    status?: string;
    version?: number;
    original: PbPageDataItem | FolderItem;
    selectable: boolean;
}

const createRecordsData = (items: SearchRecordItem<PbPageDataItem>[]): Entry[] => {
    return items.map(({ data }) => {
        return {
            id: data.id,
            type: "RECORD",
            title: data.title,
            createdBy: data.createdBy?.displayName || "-",
            savedOn: data.savedOn,
            status: data.status,
            version: data.version,
            original: data || {},
            selectable: true
        };
    });
};

const createFoldersData = (items: FolderItem[]): Entry[] => {
    return items.map(item => {
        return {
            id: item.id,
            type: "FOLDER",
            title: item.title,
            createdBy: item.createdBy?.displayName || "-",
            savedOn: item.createdOn,
            original: item,
            selectable: false
        };
    });
};

export const Table = forwardRef<HTMLDivElement, Props>((props, ref) => {
    const { folders, records, loading, openPreviewDrawer, onSelectRow, sorting, onSortingChange } =
        props;
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    const [selectedSearchRecord, setSelectedSearchRecord] = useState<SearchRecordItem>();
    const [moveSearchRecordDialogOpen, setMoveSearchRecordDialogOpen] = useState<boolean>(false);

    const data = useMemo<Entry[]>(() => {
        return createFoldersData(folders).concat(createRecordsData(records));
    }, [folders, records]);

    const columns: Columns<Entry> = {
        title: {
            header: "Name",
            cell: ({ id, title, type }) => {
                if (type === "RECORD") {
                    return <PageName name={title} id={id} onClick={openPreviewDrawer} />;
                }
                return <FolderName name={title} id={id} />;
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
            cell: ({ type, original }) => {
                if (!original) {
                    return <></>;
                } else if (type === "RECORD") {
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
                }
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
