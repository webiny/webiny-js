import React, { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { FolderDialogCreate, useAcoList } from "@webiny/app-aco";
import { useHistory, useLocation } from "@webiny/react-router";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Empty } from "~/admin/components/ContentEntries/Empty";
import { Header } from "~/admin/components/ContentEntries/Header";
import { LoadingMore } from "~/admin/components/ContentEntries/LoadingMore";
import { LoadMoreButton } from "~/admin/components/ContentEntries/LoadMoreButton";
import { Preview } from "~/admin/components/ContentEntries/Preview";
import { Table } from "~/admin/components/ContentEntries/Table";
import { CmsContentEntryRecord } from "~/admin/components/ContentEntries/Table/types";
import { FOLDER_TYPE } from "~/admin/constants/folders";
import { MainContainer, Wrapper } from "./styled";
import { ListDbSort, ListMeta } from "@webiny/app-aco/types";
import { Sorting } from "@webiny/ui/DataTable";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";
import { ContentEntry } from "~/admin/views/contentEntries/ContentEntry";

interface Props {
    folderId?: string;
    defaultFolderName: string;
}

export const Main: React.VFC<Props> = ({ folderId, defaultFolderName }) => {
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
    } = useAcoList<CmsContentEntryRecord>(FOLDER_TYPE, folderId);

    const [showFoldersDialog, setFoldersDialog] = useState(false);
    const openFoldersDialog = useCallback(() => setFoldersDialog(true), []);
    const closeFoldersDialog = useCallback(() => setFoldersDialog(false), []);

    const [showPreviewDrawer, setPreviewDrawer] = useState(false);
    const openPreviewDrawer = useCallback(() => setPreviewDrawer(true), []);
    const closePreviewDrawer = useCallback(() => setPreviewDrawer(false), []);

    const { canCreate, createEntry } = useContentEntry();

    const { innerHeight: windowHeight } = window;
    const [tableHeight, setTableHeight] = useState(0);
    const tableRef = useRef<HTMLDivElement>(null);
    const [tableSorting, setTableSorting] = useState<Sorting>([]);
    const [sort, setSort] = useState<ListDbSort>();

    useEffect(() => {
        setTableHeight(tableRef?.current?.clientHeight || 0);

        return () => {
            setTableHeight(0);
        };
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

    const { showEmptyView } = useContentEntry();

    if (!showEmptyView) {
        return <ContentEntry />;
    }

    return (
        <>
            <MainContainer>
                <Header
                    title={!isListLoading ? listTitle : undefined}
                    canCreate={canCreate}
                    onCreateEntry={createEntry}
                    onCreateFolder={openFoldersDialog}
                />
                <Wrapper>
                    {records.length === 0 && folders.length === 0 && !isListLoading ? (
                        <Empty
                            canCreate={canCreate}
                            onCreateEntry={createEntry}
                            onCreateFolder={openFoldersDialog}
                        />
                    ) : (
                        <>
                            <Preview
                                open={showPreviewDrawer}
                                onClose={() => closePreviewDrawer()}
                                canCreate={canCreate}
                                onCreateEntry={createEntry}
                            />
                            <Scrollbar
                                data-testid="default-data-list"
                                onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                            >
                                <Table
                                    ref={tableRef}
                                    folders={folders}
                                    records={records}
                                    loading={isListLoading}
                                    openPreviewDrawer={openPreviewDrawer}
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
        </>
    );
};
