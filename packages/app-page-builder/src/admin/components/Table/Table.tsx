import React, { useCallback, useEffect, useState } from "react";
import { Columns, DataTable } from "@webiny/ui/DataTable";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";

import { FolderName, PageName } from "~/admin/components/Table/RowName";
import statusLabels from "~/admin/constants/pageStatusesLabels";
import { FolderItem } from "@webiny/app-folders/types";
import { PbPageData } from "~/types";
import { orderBy } from "lodash";

interface Props {
    pages: PbPageData[];
    folders: FolderItem[];
    loading: boolean;
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
}

export const Table = ({ folders, pages, loading }: Props) => {
    const [data, setData] = useState<Entry[]>([]);

    const createPagesData = useCallback(
        (items: PbPageData[]): Entry[] => {
            return items.map(item => ({
                id: item.id,
                type: "PAGE",
                title: item.title,
                createdBy: item.createdBy.displayName || "-",
                savedOn: item?.savedOn,
                status: item.status,
                version: item.version,
                category: item.category.name
            }));
        },
        [pages]
    );

    const createFoldersData = useCallback(
        (items: FolderItem[]): Entry[] => {
            return items.map(item => ({
                id: item.id,
                type: "FOLDER",
                title: item.name,
                createdBy: item.createdBy.displayName || "-",
                savedOn: item.createdOn
            }));
        },
        [folders]
    );

    useEffect(() => {
        const foldersData = createFoldersData(folders);
        const pagesData = createPagesData(pages);

        const dataset = orderBy([...foldersData, ...pagesData], "type", "asc");
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
        }
    };

    return (
        <>
            <DataTable columns={columns} data={data} loadingInitial={loading} />
        </>
    );
};
