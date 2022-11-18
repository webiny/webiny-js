import React, { useCallback, useEffect, useState } from "react";

import { ReactComponent as More } from "@material-design-icons/svg/filled/more_vert.svg";
import { FolderItem } from "@webiny/app-folders/types";
import { Columns, DataTable } from "@webiny/ui/DataTable";
import { Menu, MenuItem } from "@webiny/ui/Menu";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import { orderBy } from "lodash";

import { FolderName, PageName } from "~/admin/components/Table/RowName";
import statusLabels from "~/admin/constants/pageStatusesLabels";

import { PbPageData } from "~/types";

interface Props {
    pages: PbPageData[];
    folders: FolderItem[];
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
    actions: boolean;
}

export const Table = ({ folders, pages }: Props) => {
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
                category: item.category.name,
                actions: true
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
                savedOn: item.createdOn,
                actions: false
            }));
        },
        [folders]
    );

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
        actions: {
            header: "",
            meta: {
                hasFormControl: true,
                alignMiddle: true
            },
            cell: ({ actions }) => {
                if (actions) {
                    return (
                        <Menu handle={<More />}>
                            <MenuItem>Edit</MenuItem>
                            <MenuItem>Preview</MenuItem>
                            <MenuItem>Publish</MenuItem>
                            <MenuItem>Delete</MenuItem>
                        </Menu>
                    );
                } else {
                    return <></>;
                }
            }
        }
    };

    return <DataTable columns={columns} data={data} />;
};
