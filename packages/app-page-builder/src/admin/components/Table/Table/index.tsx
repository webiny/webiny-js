import React, { forwardRef, useMemo, useState } from "react";

import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import { FolderDialogUpdate } from "@webiny/app-aco";
import { FolderItem } from "@webiny/app-aco/types";
import { IconButton } from "@webiny/ui/Button";
import { Columns, DataTable } from "@webiny/ui/DataTable";
import { Menu } from "@webiny/ui/Menu";
import { orderBy } from "lodash";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import useDeepCompareEffect from "use-deep-compare-effect";

import { FolderName, PageName } from "./Row/Name";
import { FolderActionDelete } from "./Row/Folder/FolderActionDelete";
import { FolderActionEdit } from "./Row/Folder/FolderActionEdit";
import { PageActionDelete } from "./Row/Page/PageActionDelete";
import { PageActionEdit } from "./Row/Page/PageActionEdit";
import { PageActionPreview } from "./Row/Page/PageActionPreview";
import { PageActionPublish } from "./Row/Page/PageActionPublish";

import statusLabels from "~/admin/constants/pageStatusesLabels";

import { PbPageDataLink } from "~/types";
import { FolderDialogDelete } from "@webiny/app-aco/components";

interface Props {
    pages: PbPageDataLink[];
    folders: FolderItem[];
    loading?: boolean;
    openPreviewDrawer: () => void;
}

interface Entry {
    id: string;
    type: "PAGE" | "FOLDER";
    title: string;
    createdBy: string;
    savedOn: string;
    status?: string;
    version?: number;
    category?: string;
    original: PbPageDataLink | FolderItem;
    selectable: boolean;
}

export const Table = forwardRef<HTMLDivElement, Props>((props, ref) => {
    const { folders, pages, loading, openPreviewDrawer } = props;

    const [data, setData] = useState<Entry[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    const createPagesData = useMemo(() => {
        return (items: PbPageDataLink[]): Entry[] =>
            items.map(item => ({
                id: item.id,
                type: "PAGE",
                title: item.title,
                createdBy: item.createdBy.displayName || "-",
                savedOn: item.savedOn,
                status: item.status,
                version: item.version,
                category: item.category.name,
                original: item,
                selectable: true
            }));
    }, [pages]);

    const createFoldersData = useMemo(() => {
        return (items: FolderItem[]): Entry[] =>
            items.map(item => ({
                id: item.id,
                type: "FOLDER",
                title: item.name,
                createdBy: item.createdBy.displayName || "-",
                savedOn: item.createdOn,
                original: item,
                selectable: false
            }));
    }, [folders]);

    useDeepCompareEffect(() => {
        const foldersData = createFoldersData(folders);
        const pagesData = createPagesData(pages);

        const dataset = orderBy([...foldersData, ...pagesData], ["type", "name"], ["asc", "asc"]);
        setData(dataset);
    }, [{ ...folders }, { ...pages }]);

    const columns: Columns<Entry> = {
        title: {
            header: "Name",
            cell: ({ id, title, type }) => {
                if (type === "PAGE") {
                    return <PageName name={title} id={id} onClick={openPreviewDrawer} />;
                } else {
                    return <FolderName name={title} id={id} />;
                }
            }
        },
        createdBy: {
            header: "Author"
        },
        savedOn: {
            header: "Last modified",
            cell: ({ savedOn }) => <TimeAgo datetime={savedOn} />
        },
        category: {
            header: "Category",
            cell: ({ category }) => category || "-"
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

                if (type === "PAGE") {
                    return (
                        <Menu handle={<IconButton icon={<More />} />}>
                            <PageActionEdit page={original as PbPageDataLink} />
                            <PageActionPreview page={original as PbPageDataLink} />
                            <PageActionPublish page={original as PbPageDataLink} />
                            <PageActionDelete page={original as PbPageDataLink} />
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
            <DataTable columns={columns} data={data} loadingInitial={loading} stickyRows={1} />
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
