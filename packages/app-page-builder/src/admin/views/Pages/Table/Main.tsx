import React, { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { i18n } from "@webiny/app/i18n";
import { FolderDialogCreate } from "@webiny/app-aco";
import { useHistory, useLocation } from "@webiny/react-router";
import { CircularProgress } from "@webiny/ui/Progress";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import CategoriesDialog from "~/admin/views/Categories/CategoriesDialog";
import PageTemplatesDialog from "~/admin/views/Pages/PageTemplatesDialog";
import useCreatePage from "~/admin/views/Pages/hooks/useCreatePage";
import useImportPage from "~/admin/views/Pages/hooks/useImportPage";
import { usePagesList } from "~/admin/views/Pages/hooks/usePagesList";
import { Empty } from "~/admin/components/Table/Empty";
import { Header } from "~/admin/components/Table/Header";
import { LoadingMore } from "~/admin/components/Table/LoadingMore";
import { LoadMoreButton } from "~/admin/components/Table/LoadMoreButton";
import { Preview } from "~/admin/components/Table/Preview";
import { Table } from "~/admin/components/Table/Table";
import { MainContainer, Wrapper } from "./styled";
import { usePagesPermissions } from "~/hooks/permissions";
import { ROOT_FOLDER } from "~/admin/constants";

const t = i18n.ns("app-page-builder/admin/views/pages/table/main");

interface Props {
    folderId?: string;
}

export const Main: React.VFC<Props> = ({ folderId: initialFolderId }) => {
    const location = useLocation();
    const history = useHistory();

    const folderId = initialFolderId === undefined ? ROOT_FOLDER : initialFolderId;

    const list = usePagesList({ folderId });

    const [isCreateLoading, setIsCreateLoading] = useState<boolean>(false);

    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const openCategoriesDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeCategoriesDialog = useCallback(() => setCategoriesDialog(false), []);

    const [showTemplatesDialog, setTemplatesDialog] = useState(false);
    const openTemplatesDialog = useCallback(() => setTemplatesDialog(true), []);
    const closeTemplatesDialog = useCallback(() => setTemplatesDialog(false), []);

    const [showFoldersDialog, setFoldersDialog] = useState(false);
    const openFoldersDialog = useCallback(() => setFoldersDialog(true), []);
    const closeFoldersDialog = useCallback(() => setFoldersDialog(false), []);

    const [showPreviewDrawer, setPreviewDrawer] = useState(false);
    const openPreviewDrawer = useCallback(() => setPreviewDrawer(true), []);
    const closePreviewDrawer = useCallback(() => setPreviewDrawer(false), []);

    const { canCreate } = usePagesPermissions();

    const { innerHeight: windowHeight } = window;
    const [tableHeight, setTableHeight] = useState(0);
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTableHeight(tableRef?.current?.clientHeight || 0);

        return () => {
            setTableHeight(0);
        };
    });

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

    const loadMoreOnScroll = debounce(({ scrollFrame }) => {
        if (scrollFrame.top > 0.8) {
            list.listMoreRecords();
        }
    }, 200);

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
                    title={!list.isListLoading ? list.listTitle : undefined}
                    canCreate={canCreate()}
                    onCreatePage={openTemplatesDialog}
                    onImportPage={openCategoriesDialog}
                    onCreateFolder={openFoldersDialog}
                    selected={list.selected}
                    searchValue={list.search}
                    onSearchChange={list.setSearch}
                />
                <Wrapper>
                    {list.records.length === 0 &&
                    list.folders.length === 0 &&
                    !list.isListLoading ? (
                        <Empty
                            isSearch={list.isSearch}
                            canCreate={canCreate()}
                            onCreatePage={openTemplatesDialog}
                            onCreateFolder={openFoldersDialog}
                        />
                    ) : (
                        <>
                            <Preview
                                open={showPreviewDrawer}
                                onClose={() => closePreviewDrawer()}
                                canCreate={canCreate()}
                                onCreatePage={openTemplatesDialog}
                            />
                            <Scrollbar
                                data-testid="default-data-list"
                                onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                            >
                                <Table
                                    ref={tableRef}
                                    folders={list.folders}
                                    records={list.records}
                                    loading={list.isListLoading}
                                    openPreviewDrawer={openPreviewDrawer}
                                    onSelectRow={list.onSelectRow}
                                    selectedRows={list.selected}
                                    sorting={list.sorting}
                                    onSortingChange={list.setSorting}
                                />
                                <LoadMoreButton
                                    show={!list.isListLoading && list.meta.hasMoreItems}
                                    disabled={list.isListLoadingMore}
                                    windowHeight={windowHeight}
                                    tableHeight={tableHeight}
                                    onClick={list.listMoreRecords}
                                />
                            </Scrollbar>
                            {list.isListLoadingMore && <LoadingMore />}
                        </>
                    )}
                </Wrapper>
            </MainContainer>
            <FolderDialogCreate
                open={showFoldersDialog}
                onClose={closeFoldersDialog}
                currentParentId={folderId || null}
            />
            <CategoriesDialog
                open={showCategoriesDialog}
                onClose={closeCategoriesDialog}
                onSelect={showDialog}
            >
                {isCreateLoading && <CircularProgress label={t`Importing page...`} />}
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
