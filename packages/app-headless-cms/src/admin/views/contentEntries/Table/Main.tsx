import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { FolderDialogCreate, useAcoList } from "@webiny/app-aco";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Empty } from "~/admin/components/ContentEntries/Empty";
import { Header } from "~/admin/components/ContentEntries/Header";
import { LoadingMore } from "~/admin/components/ContentEntries/LoadingMore";
import { LoadMoreButton } from "~/admin/components/ContentEntries/LoadMoreButton";
import { Table } from "~/admin/components/ContentEntries/Table";
import { FolderEntry, RecordEntry } from "~/admin/components/ContentEntries/Table/types";
import { MainContainer, Wrapper } from "./styled";
import {
    FolderItem,
    ListMeta,
    ListSearchRecordsSort,
    ListSearchRecordsSortItem,
    ListSearchRecordsWhereQueryVariables
} from "@webiny/app-aco/types";
import { Sorting } from "@webiny/ui/DataTable";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";
import { ContentEntry } from "~/admin/views/contentEntries/ContentEntry";
import { Header as ContentEntryHeader } from "./Header";
import { useRouter } from "@webiny/react-router";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";

interface Props {
    folderId?: string;
    defaultFolderName: string;
}

const createSort = (sorting?: Sorting): ListSearchRecordsSort | undefined => {
    if (!sorting?.length) {
        return undefined;
    }
    return sorting.reduce<ListSearchRecordsSort>((items, item) => {
        const sort = `${item.id}_${item.desc ? "DESC" : "ASC"}` as ListSearchRecordsSortItem;
        if (items.includes(sort)) {
            return items;
        }
        items.push(sort);
        return items;
    }, []);
};

const createRecords = (items: CmsContentEntry[]): RecordEntry[] => {
    return items.map(item => {
        return {
            id: item.id,
            type: "RECORD",
            title: item.meta.title,
            description: item.meta.description,
            image: item.meta.image,
            createdBy: item.createdBy.displayName,
            savedOn: item.savedOn,
            status: item.meta.status,
            version: item.meta.version,
            original: item,
            selectable: true
        };
    });
};

const createFolders = (items: FolderItem[]): FolderEntry[] => {
    return items.map(item => {
        return {
            id: item.id,
            type: "FOLDER",
            title: item.title,
            createdBy: item.createdBy.displayName || "-",
            savedOn: item.createdOn,
            original: item,
            selectable: false
        };
    });
};

export const Main: React.VFC<Props> = ({ folderId, defaultFolderName }) => {
    const {
        records: initialRecords,
        folders: initialFolders,
        listTitle = defaultFolderName,
        meta,
        isListLoading,
        isListLoadingMore,
        listItems,
        limit
    } = useAcoList({ folderId });

    const [showFoldersDialog, setFoldersDialog] = useState(false);
    const openFoldersDialog = useCallback(() => setFoldersDialog(true), []);
    const closeFoldersDialog = useCallback(() => setFoldersDialog(false), []);

    const { history } = useRouter();
    const { canCreate, contentModel } = useContentEntry();

    const createEntry = useCallback(() => {
        const folder = folderId ? `&folderId=${folderId}` : "";
        history.push(`/cms/content-entries/${contentModel.modelId}?new=true${folder}`);
    }, [canCreate, contentModel, folderId]);

    const { innerHeight: windowHeight } = window;
    const [tableHeight, setTableHeight] = useState(0);
    const tableRef = useRef<HTMLDivElement>(null);
    const [tableSorting, setTableSorting] = useState<Sorting>([]);
    const [where] = useState<ListSearchRecordsWhereQueryVariables>({});

    const sort = useMemo(() => {
        return createSort(tableSorting);
    }, [tableSorting]);

    useEffect(() => {
        setTableHeight(tableRef?.current?.clientHeight || 0);

        return () => {
            setTableHeight(0);
        };
    });

    useEffect(() => {
        const listSortedRecords = async () => {
            await listItems({ sort, where, limit });
        };
        listSortedRecords();
    }, [sort, where]);

    const loadMoreRecords = useCallback(
        async ({ hasMoreItems, cursor }: ListMeta) => {
            if (!hasMoreItems || !cursor) {
                return;
            }

            await listItems({ after: cursor, sort, where, limit });
        },
        [listItems, sort]
    );

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

    const { showEmptyView } = useContentEntry();

    const records = useMemo(() => {
        return createRecords(initialRecords as unknown as CmsContentEntry[]);
    }, [initialRecords]);
    const folders = useMemo(() => {
        return createFolders(initialFolders);
    }, [initialFolders]);

    if (!showEmptyView) {
        return (
            <>
                <ContentEntryHeader />
                <ContentEntry />
            </>
        );
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
                            <Scrollbar
                                data-testid="default-data-list"
                                onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                            >
                                <Table
                                    ref={tableRef}
                                    folders={folders}
                                    records={records}
                                    loading={isListLoading}
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
                open={showFoldersDialog}
                onClose={closeFoldersDialog}
                currentParentId={folderId || null}
            />
        </>
    );
};
