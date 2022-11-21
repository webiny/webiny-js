import React, { useEffect, useMemo, useState } from "react";

import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import { FolderItem, LinkItem } from "@webiny/app-folders/types";
import { Columns, DataTable } from "@webiny/ui/DataTable";
import { Menu } from "@webiny/ui/Menu";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import { orderBy } from "lodash";

import { FolderName, PageName } from "~/admin/components/Table/Row/RowName";
import statusLabels from "~/admin/constants/pageStatusesLabels";

import { PbPageDataLink } from "~/types";
import RowActionDelete from "~/admin/components/Table/Row/RowActionDelete";
import RowActionEdit from "~/admin/components/Table/Row/RowActionEdit";
import RowActionPreviewPage from "~/admin/components/Table/Row/RowActionPreview";
import RowActionPublishPage from "~/admin/components/Table/Row/RowActionPublish";
import RowActionDeleteFolder from "~/admin/components/Table/Row/RowActionDeleteFolder";

interface Props {
    pages: PbPageDataLink[];
    folders: FolderItem[];
    loading?: boolean;
    onDeletePage: (link: LinkItem) => void;
    deleteFolder: (folder: FolderItem) => Promise<boolean>;
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
    original?: PbPageDataLink | FolderItem;
}

export const Table = ({ folders, pages, loading, onDeletePage, deleteFolder }: Props) => {
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
                original: item as PbPageDataLink
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
                original: item as FolderItem
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
                if (type === "FOLDER") {
                    return <FolderName name={title} id={id} />;
                } else {
                    return <PageName name={title} id={id} />;
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
                            <RowActionEdit page={original as PbPageDataLink} />
                            <RowActionPreviewPage page={original as PbPageDataLink} />
                            <RowActionPublishPage page={original as PbPageDataLink} />
                            <RowActionDelete
                                page={original as PbPageDataLink}
                                onDeletePageSuccess={onDeletePage}
                            />
                        </Menu>
                    );
                } else {
                    return (
                        <Menu handle={<More />}>
                            <RowActionDeleteFolder
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
