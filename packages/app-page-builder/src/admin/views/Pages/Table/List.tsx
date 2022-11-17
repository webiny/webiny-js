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

import React, { useCallback, useEffect, useState } from "react";

import { useFolders, useLinks, FolderDialogCreate } from "@webiny/app-folders";
import { useApolloClient } from "@apollo/react-hooks";
import { GET_PAGE } from "~/admin/graphql/pages";

import { GetPageQueryResponse, GetPageQueryVariables } from "~/pageEditor/graphql";
import { PbPageData } from "~/types";

import { FolderItem, LinkItem } from "@webiny/app-folders/types";
import { Table } from "~/admin/components/Table/Table";
import { Empty } from "~/admin/views/Pages/Table/Empty";
import { Header } from "~/admin/components/Table/Header";
import useCreatePage from "~/admin/views/Pages/hooks/useCreatePage";
import { CircularProgress } from "@webiny/ui/Progress";
import CategoriesDialog from "~/admin/views/Categories/CategoriesDialog";
import styled from "@emotion/styled";

interface Props {
    currentFolderId?: string;
}

enum LoadingLabel {
    CREATING_PAGE = "Creating page..."
}

const Container = styled("div")`
    padding: 24px;
`;

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

    const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const openCategoryDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeCategoryDialog = useCallback(() => setCategoriesDialog(false), []);

    const [showFoldersDialog, setFoldersDialog] = useState(false);
    const openFoldersDialog = useCallback(() => setFoldersDialog(true), []);
    const closeFoldersDialog = useCallback(() => setFoldersDialog(false), []);

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
        console.log(folders);
        const subFolders = getCurrentFolderList(folders, currentFolderId);
        setSubFolders(subFolders);
    }, [folders, currentFolderId]);

    const { createPageMutation } = useCreatePage({
        setLoadingLabel: () => setLoadingLabel(LoadingLabel.CREATING_PAGE),
        clearLoadingLabel: () => setLoadingLabel(null),
        closeDialog: closeCategoryDialog
    });

    return (
        <>
            <FolderDialogCreate
                type={"page"}
                open={showFoldersDialog}
                onClose={closeFoldersDialog}
                parentId={currentFolderId || null}
            />

            <CategoriesDialog
                open={showCategoriesDialog}
                onClose={closeCategoryDialog}
                onSelect={createPageMutation}
            >
                {loadingLabel && <CircularProgress label={loadingLabel} />}
            </CategoriesDialog>

            {pages.length === 0 && subFolders.length === 0 ? (
                <Empty
                    canCreate={true}
                    onCreatePage={openCategoryDialog}
                    onCreateFolder={openFoldersDialog}
                />
            ) : (
                <Container>
                    <Header onCreatePage={openCategoryDialog} onCreateFolder={openFoldersDialog} />
                    <Table folders={subFolders} pages={pages} />
                </Container>
            )}
        </>
    );
};
