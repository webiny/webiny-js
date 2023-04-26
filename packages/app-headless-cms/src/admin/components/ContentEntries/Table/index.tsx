import React, { forwardRef, useState } from "react";

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
import useDeepCompareEffect from "use-deep-compare-effect";
import { EntryName, FolderName } from "./Row/Name";
import { FolderActionDelete } from "./Row/Folder/FolderActionDelete";
import { FolderActionEdit } from "./Row/Folder/FolderActionEdit";
import { RecordActionDelete } from "./Row/Record/RecordActionDelete";
import { RecordActionEdit } from "./Row/Record/RecordActionEdit";
import { RecordActionMove } from "./Row/Record/RecordActionMove";
import { RecordActionPublish } from "./Row/Record/RecordActionPublish";
import { statusLabels } from "~/admin/constants/statusLabels";
import { FOLDER_TYPE } from "~/admin/constants/folders";
import { EntryDialogMove } from "@webiny/app-aco/components/Dialogs/DialogMove";
import { menuStyles } from "./styled";
import { parseIdentifier } from "@webiny/utils";
import { CmsContentEntryRecord, Entry, FolderEntry, RecordEntry } from "./types";

interface Props {
    records: SearchRecordItem<CmsContentEntryRecord>[];
    folders: FolderItem[];
    loading?: boolean;
    openPreviewDrawer: () => void;
    sorting: Sorting;
    onSortingChange: OnSortingChange;
}

const createRecords = (items: SearchRecordItem<CmsContentEntryRecord>[]): RecordEntry[] => {
    return items.map(item => {
        const { data } = item;
        return {
            id: item.id,
            type: "RECORD",
            title: item.title,
            description: item.content,
            image: data.image,
            createdBy: data.createdBy.displayName,
            savedOn: data.savedOn,
            status: data.status,
            version: data.version,
            original: data || {},
            selectable: true
        };
    });
};

const createFolders = (items: FolderItem[]): FolderEntry[] => {
    return items.map(item => {
        return {
            id: item.id,
            type: "FOLDER",
            title: item.title,
            createdBy: item.createdBy.displayName || "-",
            savedOn: item.createdOn,
            original: item,
            selectable: false
        };
    });
};

export const Table = forwardRef<HTMLDivElement, Props>((props, ref) => {
    const { folders, records, loading, openPreviewDrawer, sorting, onSortingChange } = props;

    const [data, setData] = useState<Entry[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    const [selectedSearchRecord, setSelectedSearchRecord] = useState<SearchRecordItem>();
    const [moveSearchRecordDialogOpen, setMoveSearchRecordDialogOpen] = useState<boolean>(false);

    useDeepCompareEffect(() => {
        const foldersData = createFolders(folders);
        const entryData = createRecords(records);
        setData([...foldersData, ...entryData]);
    }, [folders, records]);

    const columns: Columns<Entry> = {
        title: {
            header: "Name",
            cell: (record: Entry) => {
                const { id, title, type } = record;
                if (type === "RECORD") {
                    return <EntryName name={title} id={id} onClick={openPreviewDrawer} />;
                } else {
                    return <FolderName name={title} id={id} />;
                }
            },
            enableSorting: true
        },
        savedOn: {
            header: "Last modified",
            cell: ({ savedOn }: Entry) => <TimeAgo datetime={savedOn} />,
            enableSorting: true
        },
        createdBy: {
            header: "Author"
        },
        status: {
            header: "Status",
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
            cell: (record: Entry) => {
                const { type, original } = record;
                if (!original) {
                    return <></>;
                }

                if (type === "RECORD") {
                    return (
                        <Menu className={menuStyles} handle={<IconButton icon={<More />} />}>
                            <RecordActionEdit record={record} />
                            <RecordActionPublish record={record} />
                            <RecordActionMove
                                onClick={() => {
                                    setMoveSearchRecordDialogOpen(true);
                                    setSelectedSearchRecord(() => {
                                        const { id: entryId } = parseIdentifier(record.id);
                                        return records.find(item => item.id === entryId);
                                    });
                                }}
                            />
                            <RecordActionDelete record={record} />
                        </Menu>
                    );
                }
                return (
                    <Menu handle={<IconButton icon={<More />} />}>
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
                columns={columns}
                data={data}
                loadingInitial={loading}
                stickyRows={1}
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
                    type={FOLDER_TYPE}
                    searchRecord={selectedSearchRecord}
                    open={moveSearchRecordDialogOpen}
                    onClose={() => setMoveSearchRecordDialogOpen(false)}
                />
            )}
        </div>
    );
});

Table.displayName = "Table";
