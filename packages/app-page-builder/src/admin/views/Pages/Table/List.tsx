import React, { useCallback, useEffect, useState } from "react";

import { FolderDialogCreate, useFolders, useLinks } from "@webiny/app-folders";

import { FolderItem } from "@webiny/app-folders/types";
import useGetPages from "~/admin/views/Pages/hooks/useGetPages";
import { Table } from "~/admin/components/Table/Table";
import { Empty } from "~/admin/views/Pages/Table/Empty";
import { Header } from "~/admin/components/Table/Header";
import useCreatePage from "~/admin/views/Pages/hooks/useCreatePage";
import { CircularProgress } from "@webiny/ui/Progress";
import CategoriesDialog from "~/admin/views/Categories/CategoriesDialog";
import styled from "@emotion/styled";
import { useCanCreatePage } from "~/admin/views/Pages/hooks/useCanCreate";
import { FOLDER_ID_DEFAULT, FOLDER_TYPE } from "~/admin/constants/folders";

interface Props {
    currentFolderId?: string;
}

enum LoadingLabel {
    CREATING_PAGE = "Creating page..."
}

const Container = styled("div")`
    height: 100%;
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
    const { folders = [], loading: foldersLoading, deleteFolder } = useFolders(FOLDER_TYPE);
    const {
        links,
        loading: linksLoading,
        createLink,
        deleteLink
    } = useLinks(currentFolderId || FOLDER_ID_DEFAULT);
    const { pages, loading: pagesLoading } = useGetPages(links);
    const [subFolders, setSubFolders] = useState<FolderItem[]>([]);

    const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const openCategoryDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeCategoryDialog = useCallback(() => setCategoriesDialog(false), []);

    const [showFoldersDialog, setFoldersDialog] = useState(false);
    const openFoldersDialog = useCallback(() => setFoldersDialog(true), []);
    const closeFoldersDialog = useCallback(() => setFoldersDialog(false), []);

    const canCreate = useCanCreatePage();

    useEffect(() => {
        const subFolders = getCurrentFolderList(folders, currentFolderId);
        setSubFolders(subFolders);
    }, [folders.map(folder => folder.parentId).join("."), currentFolderId]);

    const { createPageMutation } = useCreatePage({
        setLoadingLabel: () => setLoadingLabel(LoadingLabel.CREATING_PAGE),
        clearLoadingLabel: () => setLoadingLabel(null),
        closeDialog: closeCategoryDialog,
        onCreatePageSuccess: id => {
            createLink({ id, folderId: currentFolderId || FOLDER_ID_DEFAULT });
        }
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

            <Container>
                <Header
                    canCreate={canCreate}
                    onCreatePage={openCategoryDialog}
                    onCreateFolder={openFoldersDialog}
                />
                {pages.length === 0 &&
                subFolders.length === 0 &&
                !pagesLoading &&
                !linksLoading.LIST_LINKS &&
                !foldersLoading.LIST_FOLDERS ? (
                    <Empty
                        canCreate={canCreate}
                        onCreatePage={openCategoryDialog}
                        onCreateFolder={openFoldersDialog}
                    />
                ) : (
                    <Table
                        folders={subFolders}
                        pages={pages}
                        loading={
                            pagesLoading || linksLoading.LIST_LINKS || foldersLoading.LIST_FOLDERS
                        }
                        onDeletePage={deleteLink}
                        deleteFolder={deleteFolder}
                    />
                )}
            </Container>
        </>
    );
};
