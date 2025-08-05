import React, { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { useCreateDialog, useGetFolderLevelPermission } from "@webiny/app-aco";
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
import { ROOT_FOLDER } from "~/admin/constants";
import { BulkActions } from "~/admin/components/ContentEntries/BulkActions";
import { SelectAll } from "~/admin/components/ContentEntries/SelectAll";
import { BottomInfoBar } from "~/admin/components/ContentEntries/BottomInfoBar";

interface MainProps {
    folderId?: string;
}

export const Main = ({ folderId: initialFolderId }: MainProps) => {
    const folderId = initialFolderId === undefined ? ROOT_FOLDER : initialFolderId;
    const list = useContentEntriesList();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();

    const { history } = useRouter();

    // We check permissions on two layers - security and folder level permissions.
    const { canCreate, contentModel } = useContentEntry();
    const { getFolderLevelPermission: canManageContent } =
        useGetFolderLevelPermission("canManageContent");
    const { getFolderLevelPermission: canManageStructure } =
        useGetFolderLevelPermission("canManageStructure");

    const canCreateFolder = useCallback(
        (folderId: string) => {
            return canManageStructure(folderId);
        },
        [canManageStructure]
    );

    const canCreateContent = useCallback(
        (folderId: string) => {
            return canCreate && canManageContent(folderId);
        },
        [canManageContent, canCreate]
    );

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

    const onCreateFolder = useCallback(() => {
        showCreateFolderDialog({ currentParentId: folderId });
    }, [folderId]);

    const { showEmptyView } = useContentEntry();

    if (!showEmptyView) {
        return <ContentEntry />;
    }

    return (
        <>
            <MainContainer>
                <Header
                    title={!list.isListLoading ? list.listTitle : undefined}
                    canCreateFolder={canCreateFolder(folderId)}
                    canCreateContent={canCreateContent(folderId)}
                    onCreateEntry={createEntry}
                    onCreateFolder={onCreateFolder}
                    searchValue={list.search}
                    searchPlaceholder={list.searchPlaceholder}
                    onSearchChange={list.setSearch}
                />
                <BulkActions />
                <Wrapper>
                    <SelectAll />
                    <Filters />
                    {list.records.length === 0 &&
                    list.folders.length === 0 &&
                    !list.isListLoading ? (
                        <Empty
                            isSearch={list.isSearch}
                            canCreateFolder={canCreateFolder(folderId)}
                            canCreateContent={canCreateContent(folderId)}
                            onCreateEntry={createEntry}
                            onCreateFolder={onCreateFolder}
                        />
                    ) : (
                        <>
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
                            <BottomInfoBar
                                loading={list.isListLoading}
                                totalCount={list.meta.totalCount}
                                currentCount={list.records.length}
                            />
                            <LoadingMore show={list.isListLoadingMore} />
                        </>
                    )}
                </Wrapper>
            </MainContainer>
        </>
    );
};
