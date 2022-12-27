import React, { ReactElement, useMemo, useState } from "react";

import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import { FolderDialogUpdate } from "@webiny/app-folders";
import { FolderItem } from "@webiny/app-folders/types";
import { Columns, DataTable } from "@webiny/ui/DataTable";
import { Menu } from "@webiny/ui/Menu";

import { orderBy } from "lodash";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import useDeepCompareEffect from "use-deep-compare-effect";

import { FolderName, PageName } from "~/admin/components/Table/Row/Name";
import { FolderActionDelete } from "~/admin/components/Table/Row/Folder/FolderActionDelete";
import { FolderActionEdit } from "~/admin/components/Table/Row/Folder/FolderActionEdit";
import { PageActionDelete } from "~/admin/components/Table/Row/Page/PageActionDelete";
import { PageActionEdit } from "~/admin/components/Table/Row/Page/PageActionEdit";
import { PageActionPreview } from "~/admin/components/Table/Row/Page/PageActionPreview";
import { PageActionPublish } from "~/admin/components/Table/Row/Page/PageActionPublish";

import statusLabels from "~/admin/constants/pageStatusesLabels";

import { PbPageDataLink } from "~/types";
import { FolderDialogDelete } from "@webiny/app-folders/components";

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
}

export const Table = ({ folders, pages, loading, openPreviewDrawer }: Props): ReactElement => {
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
                original: item
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
                original: item
            }));
    }, [folders]);

    useDeepCompareEffect(() => {
        const foldersData = createFoldersData(folders);
        const pagesData = createPagesData(pages);

        const dataset = orderBy([...foldersData, ...pagesData], ["type", "name"], ["asc", "asc"]);
        setData(dataset);
        // TODO: remove Object.assign in favour of straight arrays
    }, [Object.assign({}, folders), Object.assign({}, pages)]);

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
                hasFormControl: true,
                alignMiddle: true
            },
            cell: ({ type, original }) => {
                if (!original) {
                    return <></>;
                }

                if (type === "PAGE") {
                    return (
                        <Menu handle={<More />}>
                            <PageActionEdit page={original as PbPageDataLink} />
                            <PageActionPreview page={original as PbPageDataLink} />
                            <PageActionPublish page={original as PbPageDataLink} />
                            <PageActionDelete page={original as PbPageDataLink} />
                        </Menu>
                    );
                } else {
                    return (
                        <Menu handle={<More />}>
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
        <>
            <DataTable columns={columns} data={data} loadingInitial={loading} />
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
        </>
    );
};
