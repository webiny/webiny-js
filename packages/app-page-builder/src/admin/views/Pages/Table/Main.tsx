import React, { useCallback, useEffect, useRef, useState } from "react";

import debounce from "lodash/debounce";
import { i18n } from "@webiny/app/i18n";
import { FolderDialogCreate, useAcoList } from "@webiny/app-aco";
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

import { FOLDER_TYPE, FOLDER_ID_DEFAULT } from "~/admin/constants/folders";

import { MainContainer, Wrapper } from "./styled";

import { ListMeta, ListDbSort, SearchRecordItem } from "@webiny/app-aco/types";
import { PbPageDataItem } from "~/types";
import { Sorting } from "@webiny/ui/DataTable";

const t = i18n.ns("app-page-builder/admin/views/pages/table/main");

interface Props {
    folderId?: string;
    defaultFolderName: string;
}

export const Main = ({ folderId, defaultFolderName }: Props) => {
    const location = useLocation();
    const history = useHistory();

    const {
        records,
        folders,
        listTitle = defaultFolderName,
        meta,
        isListLoading,
        isListLoadingMore,
        listItems
    } = useAcoList({ type: FOLDER_TYPE, folderId: folderId || FOLDER_ID_DEFAULT });

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
    const [tableSorting, setTableSorting] = useState<Sorting>([]);
    const [sort, setSort] = useState<ListDbSort>();

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
        folderId: folderId || FOLDER_ID_DEFAULT
    });

    const { createPageMutation } = useCreatePage({
        setLoading: () => setIsCreateLoading(true),
        clearLoading: () => setIsCreateLoading(false),
        closeDialog: closeTemplatesDialog,
        folderId: folderId || FOLDER_ID_DEFAULT
    });

    useEffect(() => {
        const sort = tableSorting.reduce((current, next) => {
            return { ...current, [next.id]: next.desc ? "DESC" : "ASC" };
        }, {});

        setSort(sort);
    }, [tableSorting]);

    useEffect(() => {
        const listSortedRecords = async () => {
            await listItems({ sort });
        };

        listSortedRecords();
    }, [sort]);

    const loadMoreRecords = async ({ hasMoreItems, cursor }: ListMeta) => {
        if (hasMoreItems && cursor) {
            await listItems({ after: cursor, sort });
        }
    };

    const loadMoreOnScroll = useCallback(
        debounce(async ({ scrollFrame }) => {
            if (scrollFrame.top > 0.8) {
                await loadMoreRecords(meta);
            }
        }, 200),
        [meta]
    );

    const loadMoreOnClick = useCallback(async () => {
        await loadMoreRecords(meta);
    }, [meta]);

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
                    title={!isListLoading ? listTitle : undefined}
                    canCreate={canCreate}
                    onCreatePage={openTemplatesDialog}
                    onImportPage={openCategoriesDialog}
                    onCreateFolder={openFoldersDialog}
                    selected={selected}
                />
                <Wrapper>
                    {records.length === 0 && folders.length === 0 && !isListLoading ? (
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
                                    folders={folders}
                                    records={records as SearchRecordItem<PbPageDataItem>[]}
                                    loading={isListLoading}
                                    openPreviewDrawer={openPreviewDrawer}
                                    onSelectRow={rows => {
                                        //@ts-ignore
                                        const ids = rows.map(row => row.original.pid);
                                        setSelected(ids);
                                    }}
                                    sorting={tableSorting}
                                    onSortingChange={setTableSorting}
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
