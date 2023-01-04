import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { LoadMoreButton } from "~/admin/components/Table/LoadMoreButton";
import { Preview } from "~/admin/components/Table/Preview";
import { Table } from "~/admin/components/Table/Table";

import { FOLDER_ID_DEFAULT, FOLDER_TYPE } from "~/admin/constants/folders";

import { MainContainer, Wrapper } from "./styled";

import { FolderItem, ListMeta } from "@webiny/app-folders/types";

interface Props {
    folderId?: string;
    defaultFolderName: string;
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

export const Main = ({ folderId, defaultFolderName }: Props) => {
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
    const [folderName, setFolderName] = useState<string>();

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

    const { innerHeight: windowHeight } = window;
    const [tableHeight, setTableHeight] = useState(0);
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTableHeight(tableRef?.current?.clientHeight || 0);

        return () => {
            setTableHeight(0);
        };
    });

    useDeepCompareEffect(() => {
        const subFolders = getCurrentFolderList(folders, folderId);
        const currentFolder = folders.find(folder => folder.id === folderId);

        setSubFolders(subFolders);
        setFolderName(currentFolder?.name || defaultFolderName);
    }, [{ ...folders }, folderId]);

    const { createPageMutation } = useCreatePage({
        setLoadingLabel: () => setLoadingLabel(LoadingLabel.CREATING_PAGE),
        clearLoadingLabel: () => setLoadingLabel(null),
        closeDialog: closeCategoryDialog,
        folderId
    });

    const loadMoreLinks = async ({ hasMoreItems, cursor }: ListMeta) => {
        if (hasMoreItems && cursor) {
            await listLinks(cursor);
        }
    };

    const loadMoreOnScroll = useCallback(
        debounce(async ({ scrollFrame }) => {
            if (scrollFrame.top > 0.8) {
                await loadMoreLinks(meta);
            }
        }, 200),
        [meta]
    );

    const loadMoreOnClick = useCallback(async () => {
        await loadMoreLinks(meta);
    }, [meta]);

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
            <MainContainer>
                <Header
                    title={!isLoading ? folderName : undefined}
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
                                    ref={tableRef}
                                    folders={subFolders}
                                    pages={pages}
                                    loading={isLoading}
                                    openPreviewDrawer={openPreviewDrawer}
                                />
                                <LoadMoreButton
                                    disabled={isLoadingMore}
                                    meta={meta}
                                    windowHeight={windowHeight}
                                    tableHeight={tableHeight}
                                    onClick={loadMoreOnClick}
                                />
                            </Scrollbar>
                            {isLoadingMore && <LoadingMore />}
                        </>
                    )}
                </Wrapper>
            </MainContainer>
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
