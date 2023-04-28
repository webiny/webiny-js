import React, { forwardRef, useMemo, useState } from "react";

import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import { EntryDialogMove, FolderDialogDelete, FolderDialogUpdate } from "@webiny/app-aco";
import { FolderItem, SearchRecordItem } from "@webiny/app-aco/types";
import { IconButton } from "@webiny/ui/Button";
import { Columns, DataTable, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { Menu } from "@webiny/ui/Menu";
import bytes from "bytes";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import useDeepCompareEffect from "use-deep-compare-effect";

import { FileName, FolderName } from "./Name";
import { FolderActionDelete } from "./FolderActionDelete";
import { FolderActionEdit } from "./FolderActionEdit";
import { RecordActionCopy } from "./RecordActionCopy";
import { RecordActionDelete } from "./RecordActionDelete";
import { RecordActionEdit } from "./RecordActionEdit";
import { RecordActionMove } from "./RecordActionMove";

import { ACO_TYPE } from "~/constants";

import { menuStyles } from "./styled";
import { FileItem } from "@webiny/app/types";
import { Settings } from "~/types";

interface TableProps {
    records: SearchRecordItem<FileItem>[];
    folders: FolderItem[];
    loading?: boolean;
    onRecordClick: (id: string) => void;
    onFolderClick: (id: string) => void;
    onSelectRow: (rows: Entry[] | []) => void;
    sorting: Sorting;
    onSortingChange: OnSortingChange;
    settings?: Settings;
}

interface Entry {
    id: string;
    type: "RECORD" | "FOLDER";
    title: string;
    createdBy: string;
    savedOn: string;
    fileType?: string;
    size?: number;
    original: FileItem | FolderItem;
    selectable: boolean;
}

export const Table = forwardRef<HTMLDivElement, TableProps>((props, ref) => {
    const {
        folders,
        records,
        loading,
        onRecordClick,
        onFolderClick,
        onSelectRow,
        sorting,
        onSortingChange
    } = props;

    const [data, setData] = useState<Entry[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    const [selectedSearchRecord, setSelectedSearchRecord] = useState<SearchRecordItem>();
    const [moveSearchRecordDialogOpen, setMoveSearchRecordDialogOpen] = useState<boolean>(false);

    const createRecordsData = useMemo(() => {
        return (items: SearchRecordItem<FileItem>[]): Entry[] =>
            items.map(({ data }) => ({
                id: data.id,
                type: "RECORD",
                title: data.name,
                createdBy: data.createdBy.displayName,
                savedOn: data.createdOn,
                fileType: data.type,
                size: data.size,
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

    useDeepCompareEffect(() => {
        const foldersData = createFoldersData(folders);
        const files = createRecordsData(records);
        setData([...foldersData, ...files]);
    }, [{ ...folders }, { ...records }]);

    const columns: Columns<Entry> = {
        title: {
            header: "Name",
            cell: ({ id, title, type, fileType }) => {
                if (type === "RECORD") {
                    return (
                        <FileName name={title} id={id} type={fileType} onClick={onRecordClick} />
                    );
                } else {
                    return <FolderName name={title} id={id} onClick={onFolderClick} />;
                }
            },
            enableSorting: true
        },
        fileType: {
            header: "Type",
            cell: ({ fileType }) => {
                if (fileType) {
                    return fileType;
                } else {
                    return "-";
                }
            }
        },
        size: {
            header: "Size",
            cell: ({ size }) => {
                if (size) {
                    return bytes.format(size, { unitSeparator: " " });
                } else {
                    return "-";
                }
            }
        },
        savedOn: {
            header: "Last modified",
            cell: ({ savedOn }) => <TimeAgo datetime={savedOn} />,
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
            cell: ({ type, original }) => {
                if (!original) {
                    return <></>;
                }

                if (type === "RECORD") {
                    return (
                        <Menu className={menuStyles} handle={<IconButton icon={<More />} />}>
                            <RecordActionCopy record={original as FileItem} />
                            <RecordActionEdit id={original.id} onClick={onRecordClick} />
                            <RecordActionMove
                                onClick={() => {
                                    setMoveSearchRecordDialogOpen(true);
                                    setSelectedSearchRecord(() =>
                                        records.find(
                                            record => record.id === (original as FileItem).id
                                        )
                                    );
                                }}
                            />
                            <RecordActionDelete record={original as FileItem} />
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
                    type={ACO_TYPE}
                    searchRecord={selectedSearchRecord}
                    open={moveSearchRecordDialogOpen}
                    onClose={() => setMoveSearchRecordDialogOpen(false)}
                />
            )}
        </div>
    );
});

Table.displayName = "Table";
