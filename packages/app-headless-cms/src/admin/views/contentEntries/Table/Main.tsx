import React, { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce.js";
import { useCreateDialog, useGetFolderLevelPermission } from "@webiny/app-aco";
import { Scrollbar } from "@webiny/admin-ui";
import { Empty } from "~/admin/components/ContentEntries/Empty/index.js";
import { Filters } from "~/admin/components/ContentEntries/Filters/index.js";
import { Header } from "~/admin/components/ContentEntries/Header/index.js";
import { LoadMoreButton } from "~/admin/components/ContentEntries/LoadMoreButton/index.js";
import { Table } from "~/admin/components/ContentEntries/Table/index.js";
import {
    useContentEntriesList,
    useContentEntry
} from "~/admin/views/contentEntries/hooks/index.js";
import { ContentEntry } from "~/admin/views/contentEntries/ContentEntry.js";
import { useRouter } from "@webiny/app-admin";
import { ROOT_FOLDER } from "~/admin/constants.js";
import { BulkActions } from "~/admin/components/ContentEntries/BulkActions/index.js";
import { BottomInfoBar } from "~/admin/components/ContentEntries/BottomInfoBar/index.js";
import { Routes } from "~/routes.js";

interface MainProps {
    folderId?: string;
}

export const Main = ({ folderId: initialFolderId }: MainProps) => {
    const folderId = initialFolderId === undefined ? ROOT_FOLDER : initialFolderId;
    const isRoot = initialFolderId === ROOT_FOLDER;
    const list = useContentEntriesList();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();

    const { goToRoute } = useRouter();

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
        goToRoute(Routes.ContentEntries.List, {
            modelId: contentModel.modelId,
            new: true,
            folderId
        });
    }, [contentModel, folderId]);

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
            <div className={"h-full relative overflow-hidden"}>
                <Header
                    isRoot={isRoot}
                    title={!list.isListLoading ? list.listTitle : undefined}
                    canCreateFolder={canCreateFolder(folderId)}
                    canCreateContent={canCreateContent(folderId)}
                    onCreateEntry={createEntry}
                    onCreateFolder={onCreateFolder}
                    searchValue={list.search}
                    onSearchChange={list.setSearch}
                />
                <div
                    className={"w-full overflow-hidden absolute top-0 bottom-0 left-0"}
                    style={{ top: "105px" }}
                >
                    <BulkActions />
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
                                loadingMore={list.isListLoadingMore}
                                totalCount={list.meta.totalCount}
                                currentCount={list.records.length}
                            />
                        </>
                    )}
                </div>
            </div>
        </>
    );
};
