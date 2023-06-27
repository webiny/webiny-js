import React, { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { FolderDialogCreate } from "@webiny/app-aco";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Empty } from "~/admin/components/ContentEntries/Empty";
import { Filters } from "~/admin/components/ContentEntries/Filters";
import { Header } from "~/admin/components/ContentEntries/Header";
import { LoadingMore } from "~/admin/components/ContentEntries/LoadingMore";
import { LoadMoreButton } from "~/admin/components/ContentEntries/LoadMoreButton";
import { Table } from "~/admin/components/ContentEntries/Table";
import { MainContainer, Wrapper } from "./styled";
import { useContentEntriesList, useContentEntry } from "~/admin/views/contentEntries/hooks";
import { ContentEntry } from "~/admin/views/contentEntries/ContentEntry";
import { useRouter } from "@webiny/react-router";

import { FOLDER_ID_DEFAULT } from "~/admin/constants";

interface Props {
    folderId?: string;
}

export const Main: React.VFC<Props> = ({ folderId: initialFolderId }) => {
    const folderId = initialFolderId === undefined ? FOLDER_ID_DEFAULT : initialFolderId;
    const list = useContentEntriesList();

    const [showFoldersDialog, setFoldersDialog] = useState(false);
    const openFoldersDialog = useCallback(() => setFoldersDialog(true), []);
    const closeFoldersDialog = useCallback(() => setFoldersDialog(false), []);

    const { history } = useRouter();
    const { canCreate, contentModel } = useContentEntry();

    const createEntry = useCallback(() => {
        const folder = folderId ? `&folderId=${encodeURIComponent(folderId)}` : "";
        history.push(`/cms/content-entries/${contentModel.modelId}?new=true${folder}`);
    }, [canCreate, contentModel, folderId]);

    const { innerHeight: windowHeight } = window;
    const [tableHeight, setTableHeight] = useState(0);
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTableHeight(tableRef?.current?.clientHeight || 0);

        return () => {
            setTableHeight(0);
        };
    });

    const loadMoreOnScroll = debounce(async ({ scrollFrame }) => {
        if (scrollFrame.top > 0.8) {
            await list.listMoreRecords();
        }
    }, 200);

    const { showEmptyView } = useContentEntry();

    if (!showEmptyView) {
        return <ContentEntry />;
    }

    return (
        <>
            <MainContainer>
                <Header
                    title={!list.isListLoading ? list.listTitle : undefined}
                    canCreate={canCreate}
                    onCreateEntry={createEntry}
                    onCreateFolder={openFoldersDialog}
                    searchValue={list.search}
                    onSearchChange={list.setSearch}
                />
                <Wrapper>
                    {list.records.length === 0 &&
                    list.folders.length === 0 &&
                    !list.isListLoading ? (
                        <Empty
                            isSearch={list.isSearch}
                            canCreate={canCreate}
                            onCreateEntry={createEntry}
                            onCreateFolder={openFoldersDialog}
                        />
                    ) : (
                        <>
                            <Scrollbar
                                data-testid="default-data-list"
                                onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                            >
                                <Filters />
                                <Table
                                    ref={tableRef}
                                    folders={list.folders}
                                    records={list.records}
                                    loading={list.isListLoading}
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
        </>
    );
};
