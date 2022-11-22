import React, { ReactElement, useEffect, useMemo, useState } from "react";

import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import { FolderItem, LinkItem } from "@webiny/app-folders/types";
import { Columns, DataTable } from "@webiny/ui/DataTable";
import { Menu } from "@webiny/ui/Menu";

import { orderBy } from "lodash";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";

import { FolderName, PageName } from "~/admin/components/Table/Row/Name";
import { FolderActionDelete } from "~/admin/components/Table/Row/Folder/FolderActionDelete";
import { PageActionDelete } from "~/admin/components/Table/Row/Page/PageActionDelete";
import { PageActionEdit } from "~/admin/components/Table/Row/Page/PageActionEdit";
import { PageActionPreview } from "~/admin/components/Table/Row/Page/PageActionPreview";
import { PageActionPublish } from "~/admin/components/Table/Row/Page/PageActionPublish";

import statusLabels from "~/admin/constants/pageStatusesLabels";

import { PbPageDataLink } from "~/types";

interface Props {
    pages: PbPageDataLink[];
    folders: FolderItem[];
    loading?: boolean;
    onDeletePage: (link: LinkItem) => void;
    deleteFolder: (folder: FolderItem) => Promise<boolean>;
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

export const Table = ({
    folders,
    pages,
    loading,
    onDeletePage,
    deleteFolder,
    openPreviewDrawer
}: Props): ReactElement => {
    const [data, setData] = useState<Entry[]>([]);

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

    useEffect(() => {
        const foldersData = createFoldersData(folders);
        const pagesData = createPagesData(pages);

        const dataset = orderBy([...foldersData, ...pagesData], ["type", "name"], ["asc", "asc"]);
        setData(dataset);
    }, [folders, pages]);

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
                            <PageActionDelete
                                page={original as PbPageDataLink}
                                onDeletePageSuccess={onDeletePage}
                            />
                        </Menu>
                    );
                } else {
                    return (
                        // TODO: bug - Menu with only one child immediatelly render the content
                        <Menu handle={<More />}>
                            <FolderActionDelete
                                folder={original as FolderItem}
                                deleteFolder={deleteFolder}
                            />
                        </Menu>
                    );
                }
            }
        }
    };

    return <DataTable columns={columns} data={data} loadingInitial={loading} />;
};
