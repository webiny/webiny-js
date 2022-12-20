import React, { useCallback, useEffect, useMemo, useState } from "react";

import debounce from "lodash/debounce";
import useDeepCompareEffect from "use-deep-compare-effect";
import { FolderDialogCreate, useFolders, useLinks } from "@webiny/app-folders";
import { useHistory, useLocation } from "@webiny/react-router";
import { CircularProgress } from "@webiny/ui/Progress";
import { Scrollbar } from "@webiny/ui/Scrollbar";

import CategoriesDialog from "~/admin/views/Categories/CategoriesDialog";
import useCreatePage from "~/admin/views/Pages/hooks/useCreatePage";
import { useCanCreatePage } from "~/admin/views/Pages/hooks/useCanCreate";
import useGetPages from "~/admin/views/Pages/hooks/useGetPages";

import { Empty } from "~/admin/components/Table/Empty";
import { Header } from "~/admin/components/Table/Header";
import { LoadingMore } from "~/admin/components/Table/LoadingMore";
import { Preview } from "~/admin/components/Table/Preview";
import { Table } from "~/admin/components/Table/Table";

import { FOLDER_ID_DEFAULT, FOLDER_TYPE } from "~/admin/constants/folders";

import { Container, Wrapper } from "./styled";

import { FolderItem } from "@webiny/app-folders/types";

interface Props {
    folderId?: string;
}

enum LoadingLabel {
    CREATING_PAGE = "Creating page..."
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

export const Main = ({ folderId }: Props) => {
    const location = useLocation();
    const history = useHistory();

    const { folders = [], loading: foldersLoading } = useFolders(FOLDER_TYPE);
    const {
        links,
        loading: linksLoading,
        meta,
        listLinks
    } = useLinks(folderId || FOLDER_ID_DEFAULT);

    const { pages, loading: pagesLoading } = useGetPages(links, folderId);

    const [subFolders, setSubFolders] = useState<FolderItem[]>([]);

    const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const openCategoryDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeCategoryDialog = useCallback(() => setCategoriesDialog(false), []);

    const [showFoldersDialog, setFoldersDialog] = useState(false);
    const openFoldersDialog = useCallback(() => setFoldersDialog(true), []);
    const closeFoldersDialog = useCallback(() => setFoldersDialog(false), []);

    const [showPreviewDrawer, setPreviewDrawer] = useState(false);
    const openPreviewDrawer = useCallback(() => setPreviewDrawer(true), []);
    const closePreviewDrawer = useCallback(() => setPreviewDrawer(false), []);

    const canCreate = useCanCreatePage();

    useDeepCompareEffect(() => {
        const subFolders = getCurrentFolderList(folders, folderId);
        setSubFolders(subFolders);
        // TODO: remove Object.assign in favour of folders array
    }, [Object.assign({}, folders), folderId]);

    const { createPageMutation } = useCreatePage({
        setLoadingLabel: () => setLoadingLabel(LoadingLabel.CREATING_PAGE),
        clearLoadingLabel: () => setLoadingLabel(null),
        closeDialog: closeCategoryDialog,
        folderId
    });

    const loadMoreOnScroll = useCallback(
        debounce(async ({ scrollFrame }) => {
            if (scrollFrame.top > 0.8) {
                if (meta.hasMoreItems && meta.cursor) {
                    await listLinks(meta.cursor);
                }
            }
        }, 200),
        [meta]
    );

    const isLoading = useMemo(() => {
        return (
            pagesLoading.INIT ||
            linksLoading.INIT ||
            foldersLoading.INIT ||
            pagesLoading.LIST ||
            linksLoading.LIST ||
            foldersLoading.LIST
        );
    }, [foldersLoading, linksLoading, pagesLoading]);

    const isLoadingMore = useMemo(() => {
        return pagesLoading.LIST_MORE || linksLoading.LIST_MORE;
    }, [linksLoading, pagesLoading]);

    useEffect(() => {
        if (!showPreviewDrawer) {
            const queryParams = new URLSearchParams(location.search);
            queryParams.delete("id");
            history.push({
                search: queryParams.toString()
            });
        }
    }, [showPreviewDrawer]);

    return (
        <>
            <Container>
                <Header
                    canCreate={canCreate}
                    onCreatePage={openCategoryDialog}
                    onCreateFolder={openFoldersDialog}
                />
                <Wrapper>
                    {pages.length === 0 && subFolders.length === 0 && !isLoading ? (
                        <Empty
                            canCreate={canCreate}
                            onCreatePage={openCategoryDialog}
                            onCreateFolder={openFoldersDialog}
                        />
                    ) : (
                        <>
                            <Preview
                                open={showPreviewDrawer}
                                onClose={() => closePreviewDrawer()}
                                canCreate={canCreate}
                                onCreatePage={openCategoryDialog}
                            />
                            <Scrollbar
                                data-testid="default-data-list"
                                onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                            >
                                <Table
                                    folders={subFolders}
                                    pages={pages}
                                    loading={isLoading}
                                    openPreviewDrawer={openPreviewDrawer}
                                />
                            </Scrollbar>
                            {isLoadingMore && <LoadingMore />}
                        </>
                    )}
                </Wrapper>
            </Container>
            <FolderDialogCreate
                type={"page"}
                open={showFoldersDialog}
                onClose={closeFoldersDialog}
                parentId={folderId || null}
            />
            <CategoriesDialog
                open={showCategoriesDialog}
                onClose={closeCategoryDialog}
                onSelect={createPageMutation}
            >
                {loadingLabel && <CircularProgress label={loadingLabel} />}
            </CategoriesDialog>
        </>
    );
};
