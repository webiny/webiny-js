import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import debounce from "lodash/debounce";
import useDeepCompareEffect from "use-deep-compare-effect";
import { FolderDialogCreate, useFolders, useRecords } from "@webiny/app-aco";
import { useHistory, useLocation } from "@webiny/react-router";
import { CircularProgress } from "@webiny/ui/Progress";
import { Scrollbar } from "@webiny/ui/Scrollbar";

import CategoriesDialog from "~/admin/views/Categories/CategoriesDialog";
import PageTemplatesDialog from "~/admin/views/Pages/PageTemplatesDialog";
import useCreatePage from "~/admin/views/Pages/hooks/useCreatePage";
import useImportPage from "~/admin/views/Pages/hooks/useImportPage";
import { useCanCreatePage } from "~/admin/views/Pages/hooks/useCanCreate";

import { Empty } from "~/admin/components/Table/Empty";
import { Header } from "~/admin/components/Table/Header";
import { LoadingMore } from "~/admin/components/Table/LoadingMore";
import { LoadMoreButton } from "~/admin/components/Table/LoadMoreButton";
import { Preview } from "~/admin/components/Table/Preview";
import { Table } from "~/admin/components/Table/Table";

import { FOLDER_ID_DEFAULT, FOLDER_TYPE } from "~/admin/constants/folders";

import { MainContainer, Wrapper } from "./styled";

import { FolderItem, ListMeta, SearchRecordItem } from "@webiny/app-aco/types";
import { PbPageDataItem } from "~/types";

interface Props {
    folderId?: string;
    defaultFolderName: string;
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
        records,
        loading: recordsLoading,
        meta,
        listRecords
    } = useRecords(FOLDER_TYPE, folderId || FOLDER_ID_DEFAULT);

    const [subFolders, setSubFolders] = useState<FolderItem[]>([]);
    const [folderName, setFolderName] = useState<string>();

    const [isCreateLoading, setIsCreateLoading] = useState<boolean>(false);
    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const [showTemplatesDialog, setTemplatesDialog] = useState(false);
    const openCategoriesDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeCategoriesDialog = useCallback(() => setCategoriesDialog(false), []);
    const openTemplatesDialog = useCallback(() => setTemplatesDialog(true), []);
    const closeTemplatesDialog = useCallback(() => setTemplatesDialog(false), []);

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

    const [selected, setSelected] = useState<string[]>([]);

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
        setFolderName(currentFolder?.title || defaultFolderName);
    }, [{ ...folders }, folderId]);

    const { showDialog } = useImportPage({
        setLoading: () => setIsCreateLoading(true),
        clearLoading: () => setIsCreateLoading(false),
        closeDialog: closeCategoriesDialog,
        folderId
    });

    const { createPageMutation } = useCreatePage({
        setLoading: () => setIsCreateLoading(true),
        clearLoading: () => setIsCreateLoading(false),
        closeDialog: closeTemplatesDialog,
        folderId
    });

    const loadMoreLinks = async ({ hasMoreItems, cursor }: ListMeta) => {
        if (hasMoreItems && cursor) {
            await listRecords({ after: cursor });
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

    const isListLoading = useMemo(() => {
        return (
            recordsLoading.INIT || foldersLoading.INIT || recordsLoading.LIST || foldersLoading.LIST
        );
    }, [foldersLoading, recordsLoading]);

    const isListLoadingMore = useMemo(() => {
        return recordsLoading.LIST_MORE;
    }, [recordsLoading]);

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
                    title={!isListLoading ? folderName : undefined}
                    canCreate={canCreate}
                    onCreatePage={openTemplatesDialog}
                    onImportPage={openCategoriesDialog}
                    onCreateFolder={openFoldersDialog}
                    selected={selected}
                />
                <Wrapper>
                    {records.length === 0 && subFolders.length === 0 && !isListLoading ? (
                        <Empty
                            canCreate={canCreate}
                            onCreatePage={openTemplatesDialog}
                            onCreateFolder={openFoldersDialog}
                        />
                    ) : (
                        <>
                            <Preview
                                open={showPreviewDrawer}
                                onClose={() => closePreviewDrawer()}
                                canCreate={canCreate}
                                onCreatePage={openTemplatesDialog}
                            />
                            <Scrollbar
                                data-testid="default-data-list"
                                onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                            >
                                <Table
                                    ref={tableRef}
                                    folders={subFolders}
                                    records={records as SearchRecordItem<PbPageDataItem>[]}
                                    loading={isListLoading}
                                    openPreviewDrawer={openPreviewDrawer}
                                    onSelectRow={rows => {
                                        //@ts-ignore
                                        const ids = rows.map(row => row.original.pid);
                                        setSelected(ids);
                                    }}
                                />
                                <LoadMoreButton
                                    show={!isListLoading && meta.hasMoreItems}
                                    disabled={isListLoadingMore}
                                    windowHeight={windowHeight}
                                    tableHeight={tableHeight}
                                    onClick={loadMoreOnClick}
                                />
                            </Scrollbar>
                            {isListLoadingMore && <LoadingMore />}
                        </>
                    )}
                </Wrapper>
            </MainContainer>
            <FolderDialogCreate
                type={FOLDER_TYPE}
                open={showFoldersDialog}
                onClose={closeFoldersDialog}
                parentId={folderId || null}
            />
            <CategoriesDialog
                open={showCategoriesDialog}
                onClose={closeCategoriesDialog}
                onSelect={showDialog}
            >
                {isCreateLoading && <CircularProgress label={"Importing page..."} />}
            </CategoriesDialog>
            {showTemplatesDialog && (
                <PageTemplatesDialog
                    onClose={closeTemplatesDialog}
                    onSelect={createPageMutation}
                    isLoading={isCreateLoading}
                />
            )}
        </>
    );
};
