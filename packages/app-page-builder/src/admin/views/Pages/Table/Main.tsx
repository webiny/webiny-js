import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { i18n } from "@webiny/app/i18n";
import { useCreateDialog, useFolders } from "@webiny/app-aco";
import { CircularProgress } from "@webiny/ui/Progress";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import CategoriesDialog from "~/admin/views/Categories/CategoriesDialog";
import PageTemplatesDialog from "~/admin/views/Pages/PageTemplatesDialog";
import useCreatePage from "~/admin/views/Pages/hooks/useCreatePage";
import useImportPage from "~/admin/views/Pages/hooks/useImportPage";
import { usePagesList } from "~/admin/views/Pages/hooks/usePagesList";
import { BulkActions } from "~/admin/components/BulkActions";
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

export const Main = ({ folderId: initialFolderId }: Props) => {
    const folderId = initialFolderId === undefined ? ROOT_FOLDER : initialFolderId;

    const list = usePagesList();

    const [isCreateLoading, setIsCreateLoading] = useState<boolean>(false);

    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const openCategoriesDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeCategoriesDialog = useCallback(() => setCategoriesDialog(false), []);

    const [showTemplatesDialog, setTemplatesDialog] = useState(false);
    const openTemplatesDialog = useCallback(() => setTemplatesDialog(true), []);
    const closeTemplatesDialog = useCallback(() => setTemplatesDialog(false), []);

    const { showDialog: showCreateFolderDialog } = useCreateDialog();

    // We check permissions on two layers - security and folder level permissions.
    const { canCreate } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const canCreateFolder = useMemo(() => {
        return flp.canManageStructure(folderId);
    }, [flp, folderId]);

    const canCreateContent = useMemo(() => {
        return canCreate() && flp.canManageContent(folderId);
    }, [flp, folderId]);

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

    const onCreateFolder = useCallback(() => {
        showCreateFolderDialog({ currentParentId: folderId });
    }, [folderId]);

    return (
        <>
            <MainContainer>
                <Header
                    title={!list.isListLoading ? list.listTitle : undefined}
                    canCreateFolder={canCreateFolder}
                    canCreateContent={canCreateContent}
                    onCreatePage={openTemplatesDialog}
                    onImportPage={openCategoriesDialog}
                    onCreateFolder={onCreateFolder}
                    selected={list.selected}
                    searchValue={list.search}
                    onSearchChange={list.setSearch}
                />
                <BulkActions />
                <Wrapper>
                    {list.records.length === 0 &&
                    list.folders.length === 0 &&
                    !list.isListLoading ? (
                        <Empty
                            isSearch={list.isSearch}
                            canCreateFolder={canCreateFolder}
                            canCreateContent={canCreateContent}
                            onCreatePage={openTemplatesDialog}
                            onCreateFolder={onCreateFolder}
                        />
                    ) : (
                        <>
                            <Preview
                                open={list.showPreviewDrawer}
                                onClose={list.closePreviewDrawer}
                                canCreate={canCreate()}
                                onCreatePage={openTemplatesDialog}
                            />
                            <Scrollbar
                                data-testid="default-data-list"
                                onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                            >
                                <Table ref={tableRef} />
                                <LoadMoreButton
                                    show={!list.isListLoading && list.meta.hasMoreItems}
                                    disabled={list.isListLoadingMore}
                                    windowHeight={windowHeight}
                                    tableHeight={tableHeight}
                                    onClick={list.listMoreRecords}
                                />
                            </Scrollbar>
                            <LoadingMore show={list.isListLoadingMore} />
                        </>
                    )}
                </Wrapper>
            </MainContainer>
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
