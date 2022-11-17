/*
Things to show:
- Empty view in case of no items inside a folder
- List of folders and items for root page
- List of folders and items for folder page
- Buttons:
    Create new folder
    Create new page
- List Elements
    Name
    Author
    Last modified
    Template
    Status
    Actions


PROBLEMS:
- How to show links at root level? no reference between linkId and entryId?
    - SOLUTION: create a linkId for each entry within the system - the link will be referenced to ROOT
- Should we run an upgrade script to create a linkId for each entry within the system?
*/

import React, { useEffect, useState } from "react";

import { useFolders, useLinks } from "@webiny/app-folders";
import { useApolloClient } from "@apollo/react-hooks";
import { GET_PAGE } from "~/admin/graphql/pages";

import { GetPageQueryResponse, GetPageQueryVariables } from "~/pageEditor/graphql";
import { PbPageData } from "~/types";

import { FolderItem, LinkItem } from "@webiny/app-folders/types";
import { Table } from "~/admin/components/Table/Table";
import { Empty } from "~/admin/views/Pages/Table/Empty";
import { Header } from "~/admin/components/Table/Header";

interface Props {
    currentFolderId?: string;
}

const getCurrentFolderList = (
    folders: FolderItem[],
    currentFolderId?: string
): FolderItem[] | [] => {
    if (!folders) {
        return [];
    }
    if (currentFolderId) {
        return folders.filter(folder => folder.parentId === currentFolderId);
    } else {
        return folders.filter(folder => !folder.parentId);
    }
};

export const List = ({ currentFolderId }: Props) => {
    const client = useApolloClient();
    const { folders } = useFolders("page");
    const { links } = useLinks(currentFolderId);
    const [pages, setPages] = useState<PbPageData[]>([]);
    const [subFolders, setSubFolders] = useState<FolderItem[]>([]);

    const getPagesByLinks = async (links: LinkItem[]) => {
        return Promise.all(
            links.map(async link => {
                const { data: response } = await client.query<
                    GetPageQueryResponse,
                    GetPageQueryVariables
                >({
                    query: GET_PAGE,
                    variables: { id: link.id }
                });

                const { data, error } = response.pageBuilder.getPage;

                if (!data) {
                    throw new Error(error?.message || "Could not fetch page");
                }

                return data;
            })
        );
    };

    useEffect(() => {
        async function getPagesData() {
            const linkedPages = await getPagesByLinks(links);
            setPages(linkedPages);
        }

        getPagesData();
    }, [links]);

    useEffect(() => {
        const subFolders = getCurrentFolderList(folders, currentFolderId);
        setSubFolders(subFolders);
    }, [folders, currentFolderId]);

    return pages.length === 0 && subFolders.length === 0 ? (
        <Empty canCreate={true} onCreatePage={() => console.log("ciao")} />
    ) : (
        <>
            <Header />
            <Table folders={subFolders} pages={pages} />
        </>
    );
};
