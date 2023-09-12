import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import { FolderDialogDelete, FolderDialogUpdate, useNavigateFolder } from "@webiny/app-aco";
import { FolderItem } from "@webiny/app-aco/types";
import { IconButton } from "@webiny/ui/Button";
import { Columns, DataTable, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { Menu } from "@webiny/ui/Menu";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import { EntryName, FolderName } from "./Row/Name";
import { FolderActionDelete } from "./Row/Folder/FolderActionDelete";
import { FolderActionEdit } from "./Row/Folder/FolderActionEdit";
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

interface Props {
    records: RecordEntry[];
    folders: FolderEntry[];
    loading?: boolean;
    sorting: Sorting;
    onSortingChange: OnSortingChange;
}

export const Table = forwardRef<HTMLDivElement, Props>((props, ref) => {
    const { currentFolderId } = useNavigateFolder();
    const { folders, records, loading, sorting, onSortingChange } = props;
    const { model } = useModel();

    const { history } = useRouter();
    const { canEdit: baseCanEdit } = usePermission();

    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

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
            createdOn: {
                header: "Created",
                className: "cms-aco-list-createdOn",
                cell: ({ createdOn }: Entry) => <TimeAgo datetime={createdOn} />,
                enableSorting: true
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

                    return (
                        <Menu handle={<IconButton icon={<More />} />}>
                            <FolderActionEdit
                                onClick={() => {
                                    setUpdateDialogOpen(true);
                                    setSelectedFolder(record.original);
                                }}
                            />
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
                loadingInitial={loading}
                stickyRows={1}
                sorting={sorting}
                initialSorting={[
                    {
                        id: "createdOn",
                        desc: true
                    }
                ]}
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
        </div>
    );
});

Table.displayName = "Table";
