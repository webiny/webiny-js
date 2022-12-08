import React, { useCallback, useState } from "react";

import debounce from "lodash/debounce";
import useDeepCompareEffect from "use-deep-compare-effect";
import { FolderDialogCreate, useFolders, useLinks } from "@webiny/app-folders";
import { CircularProgress } from "@webiny/ui/Progress";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { useRouter } from "@webiny/react-router";

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
    const { history } = useRouter();
    const { folders = [], loading: foldersLoading } = useFolders(FOLDER_TYPE);
    const {
        links,
        loading: linksLoading,
        meta,
        listLinks,
        createLink,
        deleteLink
    } = useLinks(folderId || FOLDER_ID_DEFAULT);
    const [loadingTimes, setLoadingTimes] = useState<number>(0);

    const {
        pages,
        loading: pagesLoading,
        moreLoading: pagesMoreLoading
    } = useGetPages(links, loadingTimes);

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
        onCreatePageSuccess: async id => {
            await createLink({ id, folderId: folderId || FOLDER_ID_DEFAULT });
            history.push(`/page-builder/editor/${encodeURIComponent(id)}`);
        }
    });

    const loadMoreOnScroll = useCallback(
        debounce(async ({ scrollFrame }) => {
            if (scrollFrame.top > 0.8) {
                if (meta.hasMoreItems && meta.cursor) {
                    setLoadingTimes(prev => prev++);
                    await listLinks(meta.cursor);
                }
            }
        }, 200),
        [meta]
    );

    return (
        <>
            <Container>
                <Header
                    canCreate={canCreate}
                    onCreatePage={openCategoryDialog}
                    onCreateFolder={openFoldersDialog}
                />
                <Wrapper>
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
                                    loading={
                                        pagesLoading ||
                                        linksLoading.LIST_LINKS ||
                                        foldersLoading.LIST_FOLDERS
                                    }
                                    onDeletePage={deleteLink}
                                    openPreviewDrawer={openPreviewDrawer}
                                />
                            </Scrollbar>
                            {(linksLoading.LIST_MORE_LINKS || pagesMoreLoading) && <LoadingMore />}
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
