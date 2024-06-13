import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { useCreateDialog, useFolders } from "@webiny/app-aco";
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
    const { folderLevelPermissions: flp } = useFolders();

    const canCreateFolder = useMemo(() => {
        return flp.canManageStructure(folderId);
    }, [flp, folderId]);

    const canCreateContent = useMemo(() => {
        return canCreate && flp.canManageContent(folderId);
    }, [flp, folderId]);

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
                    canCreateFolder={canCreateFolder}
                    canCreateContent={canCreateContent}
                    onCreateEntry={createEntry}
                    onCreateFolder={onCreateFolder}
                    searchValue={list.search}
                    onSearchChange={list.setSearch}
                />
                <BulkActions />
                <Wrapper>
                    <Filters />
                    <SelectAll />
                    {list.records.length === 0 &&
                    list.folders.length === 0 &&
                    !list.isListLoading ? (
                        <Empty
                            isSearch={list.isSearch}
                            canCreateFolder={canCreateFolder}
                            canCreateContent={canCreateContent}
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
                            <LoadingMore show={list.isListLoadingMore} />
                        </>
                    )}
                </Wrapper>
            </MainContainer>
        </>
    );
};
