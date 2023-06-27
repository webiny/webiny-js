import dotPropImmutable from "dot-prop-immutable";
import { useCallback, useContext, useEffect, useState } from "react";
import { FoldersContext } from "~/contexts/folders";
import { SearchRecordsContext } from "~/contexts/records";
import {
    FolderItem,
    GenericSearchData,
    ListMeta,
    ListSearchRecordsQueryVariables,
    ListSearchRecordsSort,
    ListSearchRecordsWhereQueryVariables,
    SearchRecordItem
} from "~/types";
import { sortTableItems, validateOrGetDefaultDbSort } from "~/sorting";
import { useAcoApp } from "~/hooks/useAcoApp";
import { useNavigateFolder } from "~/hooks/useNavigateFolder";

interface UseAcoListResponse<T> {
    folders: FolderItem[];
    records: SearchRecordItem<T>[];
    listTitle?: string;
    isListLoading: boolean;
    isListLoadingMore: boolean;
    isSearch: boolean;
    meta: ListMeta;
    listMoreRecords: () => void;
    setFilters: (data: Record<string, any>) => void;
    setSearchQuery: (query: string) => void;
    setListSort: (state: ListSearchRecordsSort) => void;
}

export interface State {
    after?: string;
    filters?: Record<string, any>;
    folderId: string;
    isSearch: boolean;
    limit: number;
    listSort: ListSearchRecordsSort;
    searchQuery: string;
}

const initializeAcoListState = (folderId: string): State => {
    return {
        after: undefined,
        filters: undefined,
        folderId: folderId,
        isSearch: false,
        limit: 50,
        listSort: [],
        searchQuery: ""
    };
};

const getCurrentFolderList = (
    folders?: FolderItem[] | null,
    currentFolderId?: string
): FolderItem[] | [] => {
    if (!folders) {
        return [];
    }
    if (!currentFolderId || currentFolderId.toLowerCase() === "root") {
        return folders.filter(
            folder => !folder.parentId || folder.parentId.toLowerCase() === "root"
        );
    }
    return folders.filter(folder => folder.parentId === currentFolderId);
};

const getCurrentRecordList = <T = GenericSearchData>(
    records: SearchRecordItem<T>[],
    folderIdPath: string,
    currentFolderId?: string
): SearchRecordItem<T>[] => {
    if (!records) {
        return [];
    }

    if (!currentFolderId) {
        return records;
    }

    return records.filter(
        (record): record is SearchRecordItem<T> =>
            dotPropImmutable.get(record, folderIdPath) === currentFolderId
    );
};

export const useAcoList = <T = GenericSearchData>(): UseAcoListResponse<T> => {
    const { currentFolderId = "ROOT" } = useNavigateFolder();
    const { folderIdPath, folderIdInPath } = useAcoApp();
    const folderContext = useContext(FoldersContext);
    const searchContext = useContext(SearchRecordsContext);

    if (!folderContext || !searchContext) {
        throw new Error("useAcoList must be used within a ACOProvider");
    }

    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [records, setRecords] = useState<SearchRecordItem<T>[]>([]);
    const [listTitle, setListTitle] = useState<string | undefined>();
    const [state, setState] = useState(initializeAcoListState(currentFolderId));

    const {
        folders: originalFolders,
        loading: foldersLoading,
        listFolders,
        getDescendantFolders
    } = folderContext;
    const { records: originalRecords, loading: recordsLoading, listRecords, meta } = searchContext;

    /**
     * On first mount, call `listFolders` and `setState`, which will either issue a network request, or load folders and records from cache.
     * We don't need to store the result of it to any local state; that is managed by the context provider.
     *
     * IMPORTANT: we check if the folders[type] array exists: the hook can be used from multiple components and
     * fetch the outdated list from Apollo Cache. Since the state is managed locally, we fetch the folders only
     * at the first mount.
     *
     * We don't call `listRecords` directly, instead we call `setState` making it the only driver to fetch records from the apis.
     */
    useEffect(() => {
        if (!originalFolders) {
            listFolders();
        }

        setState(state => {
            if (currentFolderId === state.folderId) {
                return state;
            }

            return {
                ...state,
                folderId: currentFolderId,
                after: undefined,
                filters: undefined,
                isSearch: false,
                searchQuery: ""
            };
        });
    }, [currentFolderId]);

    /**
     * Any time we receive a `folders` list update:
     * - we set an empty array in case of search;
     * - we set the list filtered by the current `type` and parent `folderId`, sorted according to the current `sort` value;
     * - we set the current folder name.
     */
    useEffect(() => {
        if (state.isSearch) {
            setFolders([]);
            return;
        }

        const subFolders = getCurrentFolderList(originalFolders, currentFolderId);
        setFolders(() => {
            return sortTableItems(subFolders, state.listSort);
        });

        const currentFolder = originalFolders?.find(folder => folder.id === currentFolderId);
        setListTitle(currentFolder?.title);
    }, [originalFolders, currentFolderId, state.isSearch]);

    /**
     * Any time we receive a `records` list or `folderId` update:
     * - we set all `records` in case of search query;
     * - we set the `records` list filtered by the current `folderId`.
     */
    useEffect(() => {
        if (state.isSearch) {
            setRecords(originalRecords as SearchRecordItem<T>[]);
            return;
        }

        const subRecords = getCurrentRecordList<T>(
            originalRecords as SearchRecordItem<T>[],
            folderIdPath,
            currentFolderId
        );
        setRecords(subRecords);
    }, [originalRecords, currentFolderId, state.isSearch]);

    /**
     * Any time we receive a new `sort` value:
     * - we sort the current `folders` list according to `sorting` value;
     */
    useEffect(() => {
        setFolders(prev => {
            return sortTableItems(prev, state.listSort);
        });
    }, [state.listSort]);

    /**
     * Utility function to list/load more records, the `meta` state is tracked internally.
     */
    const listMoreRecords = useCallback(() => {
        const { hasMoreItems, cursor } = meta;
        if (hasMoreItems && cursor) {
            setState(state => ({
                ...state,
                after: cursor
            }));
        }
    }, [meta]);

    /**
     * Any time we receive new useful `state` params:
     * - we fetch records according to the new params
     */
    useEffect(() => {
        const listItems = async () => {
            const isSearch = Boolean(state.searchQuery || state.filters);
            const AND: ListSearchRecordsWhereQueryVariables[] = [];

            if (state.filters) {
                AND.push(state.filters);
            }

            let locationWhere = dotPropImmutable.set({}, folderIdPath, state.folderId);

            if (isSearch) {
                if (state.folderId === "ROOT") {
                    locationWhere = undefined;
                } else {
                    locationWhere = dotPropImmutable.set(
                        {},
                        folderIdInPath,
                        getDescendantFolders(state.folderId).map(folder => folder.id)
                    );
                }
            }

            const params: ListSearchRecordsQueryVariables = {
                limit: state.limit,
                sort: validateOrGetDefaultDbSort(state.listSort),
                search: state.searchQuery,
                after: state.after,
                where: {
                    ...locationWhere,
                    ...(AND.length && { AND })
                }
            };

            await listRecords(params);
        };

        listItems();

        setState(state => ({
            ...state,
            isSearch: Boolean(state.searchQuery || state.filters)
        }));
    }, [state.folderId, state.filters, state.searchQuery, state.after, state.listSort]);

    return {
        folders,
        records,
        listTitle,
        isSearch: state.isSearch,
        isListLoading: Boolean(
            recordsLoading.INIT || foldersLoading.INIT || recordsLoading.LIST || foldersLoading.LIST
        ),
        isListLoadingMore: Boolean(recordsLoading.LIST_MORE),
        meta,
        setSearchQuery(query) {
            setState(state => ({
                ...state,
                searchQuery: query
            }));
        },
        setFilters(data) {
            setState(state => ({
                ...state,
                filters: data
            }));
        },
        setListSort(sort: ListSearchRecordsSort) {
            setState(state => ({
                ...state,
                listSort: sort
            }));
        },
        listMoreRecords
    };
};
