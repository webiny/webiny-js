/*
PROBLEMS:
- How to show links at root level? no reference between linkId and entryId?
    - SOLUTION: create a linkId for each entry within the system - the link will be referenced to ROOT
- Should we run an upgrade script to create a linkId for each entry within the system?
*/

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
    const { folders } = useFolders("page");
    const { links } = useLinks(currentFolderId);
    const { pages } = useGetPages(links);
    const [subFolders, setSubFolders] = useState<FolderItem[]>([]);

    const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const openCategoryDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeCategoryDialog = useCallback(() => setCategoriesDialog(false), []);

    const [showFoldersDialog, setFoldersDialog] = useState(false);
    const openFoldersDialog = useCallback(() => setFoldersDialog(true), []);
    const closeFoldersDialog = useCallback(() => setFoldersDialog(false), []);

    const canCreate = useCanCreatePage();

    // TODO: test with https://github.com/kentcdodds/use-deep-compare-effect
    useEffect(() => {
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
                    canCreate={canCreate}
                    onCreatePage={openCategoryDialog}
                    onCreateFolder={openFoldersDialog}
                />
            ) : (
                <Container>
                    <Header
                        canCreate={canCreate}
                        onCreatePage={openCategoryDialog}
                        onCreateFolder={openFoldersDialog}
                    />
                    <Table folders={subFolders} pages={pages} />
                </Container>
            )}
        </>
    );
};
