import React, { useCallback, useContext, useEffect } from "react";
import dotPropImmutable from "dot-prop-immutable";
import pick from "lodash/pick";
import { useStateIfMounted } from "@webiny/app-admin";
import { useSecurity } from "@webiny/app-security";
import {
    FolderItem,
    GenericSearchData,
    ListMeta,
    ListSearchRecordsQueryVariables,
    ListSearchRecordsSort,
    SearchRecordItem
} from "~/types";
import { useAcoApp, useNavigateFolder } from "~/hooks";
import { FoldersContext } from "~/contexts/folders";
import { SearchRecordsContext } from "~/contexts/records";
import { sortTableItems, validateOrGetDefaultDbSort } from "~/sorting";
import { ROOT_FOLDER } from "~/constants";

export interface AcoListContextData<T> {
    folders: FolderItem[];
    hideFilters: () => void;
    isListLoading: boolean;
    isListLoadingMore: boolean;
    isSearch: boolean;
    listMoreRecords: () => void;
    listTitle?: string;
    meta: ListMeta;
    records: T[];
    selected: T[];
    setFilters: (data: Record<string, any>) => void;
    setListSort: (state: ListSearchRecordsSort) => void;
    setSearchQuery: (query: string) => void;
    setSelected: (selected: T[]) => void;
    showFilters: () => void;
    showingFilters: boolean;
    showingSelectAll: boolean;
    where: Record<string, any>;
    searchQuery: string;
    selectedLength: number;
    isSelectedAll: boolean;
    selectAll: () => void;
    unselectAll: () => void;
}

export const AcoListContext = React.createContext<
    AcoListContextData<GenericSearchData> | undefined
>(undefined);

export interface State<T> {
    after?: string;
    filters?: Record<string, any>;
    folderId?: string;
    isSearch: boolean;
    limit: number;
    listSort: ListSearchRecordsSort;
    searchQuery: string;
    selected: T[];
    showingFilters: boolean;
    showingSelectAll: boolean;
    where: Record<string, any>;
    selectedLength: number;
    isSelectedAll: boolean;
}

const initializeAcoListState = (): State<GenericSearchData> => {
    return {
        after: undefined,
        filters: undefined,
        folderId: undefined,
        isSearch: false,
        limit: 50,
        listSort: [],
        searchQuery: "",
        selected: [],
        showingFilters: false,
        showingSelectAll: false,
        where: {},
        selectedLength: 0,
        isSelectedAll: false
    };
};

const getCurrentFolderList = (
    folders?: FolderItem[] | null,
    currentFolderId?: string
): FolderItem[] | [] => {
    if (!folders) {
        return [];
    }
    if (!currentFolderId || currentFolderId.toLowerCase() === ROOT_FOLDER) {
        return folders.filter(
            folder => !folder.parentId || folder.parentId.toLowerCase() === ROOT_FOLDER
        );
    }
    return folders.filter(folder => folder.parentId === currentFolderId);
};

const getCurrentRecordList = <T = GenericSearchData,>(
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

export interface AcoListProviderProps {
    children: React.ReactNode;
    own?: boolean;
    titleFieldId: string | null;
}

export const AcoListProvider = ({ children, ...props }: AcoListProviderProps) => {
    const { identity } = useSecurity();
    const { currentFolderId } = useNavigateFolder();
    const { folderIdPath, folderIdInPath } = useAcoApp();
    const folderContext = useContext(FoldersContext);
    const searchContext = useContext(SearchRecordsContext);

    if (!folderContext || !searchContext) {
        throw new Error("useAcoList must be used within a ACOProvider");
    }

    const [folders, setFolders] = useStateIfMounted<FolderItem[]>([]);
    const [records, setRecords] = useStateIfMounted<SearchRecordItem[]>([]);
    const [listTitle, setListTitle] = useStateIfMounted<string | undefined>(undefined);
    const [state, setState] = useStateIfMounted<State<GenericSearchData>>(initializeAcoListState());

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
        if (!currentFolderId) {
            return;
        }

        if (!originalFolders) {
            listFolders();
        }

        setState(state => {
            return {
                ...state,
                after: undefined,
                filters: undefined,
                folderId: currentFolderId,
                isSearch: false,
                searchQuery: "",
                selected: [],
                showingFilters: false,
                showingSelectAll: false,
                where: {},
                selectedLength: 0,
                isSelectedAll: false
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
        const currentFolder = originalFolders?.find(
            folder => folder.id === (state.folderId || ROOT_FOLDER)
        );

        setListTitle(currentFolder?.title);

        if (state.isSearch) {
            setFolders([]);
            return;
        }

        const subFolders = getCurrentFolderList(originalFolders, state.folderId);
        setFolders(() => {
            return sortTableItems(subFolders, state.listSort);
        });
    }, [originalFolders, state.folderId, state.isSearch]);

    /**
     * Any time we receive a `records` list or `folderId` update:
     * - we set all `records` in case of search query;
     * - we set the `records` list filtered by the current `folderId`.
     */
    useEffect(() => {
        if (state.isSearch) {
            setRecords(originalRecords as SearchRecordItem[]);
            return;
        }

        const subRecords = getCurrentRecordList(
            originalRecords as SearchRecordItem[],
            folderIdPath,
            state.folderId
        );
        setRecords(subRecords);
    }, [originalRecords, state.folderId, state.isSearch]);

    /**
     * Any time we receive a new `sort` value:
     * - we sort the current `folders` list according to `sorting` value;
     */
    useEffect(() => {
        setFolders(prev => {
            const titleField = props?.titleFieldId || "id";
            return sortTableItems(prev, state.listSort, {
                [titleField]: "title"
            });
        });
    }, [state.listSort]);

    /**
     * Utility function to list/load more records, the `meta` state is tracked internally.
     */
    const listMoreRecords = useCallback(() => {
        const { hasMoreItems, cursor } = meta;
        if (hasMoreItems && cursor) {
            setState(state => ({ ...state, after: cursor }));
        }
    }, [meta]);

    /**
     * This effect runs when the component mounts and updates the state with a 'where' condition
     * based on the current state properties and props.
     *
     * It constructs the 'where' condition which is used for filtering data based on the folder ID,
     * search query, and filters present in the state. If a search query or any active filter exists,
     * it adjusts the 'where' and `isSearch` condition accordingly.
     */
    useEffect(() => {
        // Initialize the 'locationWhere' object with the current folder ID
        let locationWhere = dotPropImmutable.set({}, folderIdPath, state.folderId);

        console.log("state", state);

        // Update 'locationWhere' if there is an active search
        if (state.folderId === ROOT_FOLDER) {
            locationWhere = undefined;
        } else {
            // Get descendant folders and set them in 'locationWhere'
            const descendantFolderIds = getDescendantFolders(state.folderId).map(
                folder => folder.id
            );

            console.log("descendantFolderIds", descendantFolderIds);

            locationWhere = dotPropImmutable.set({}, folderIdInPath, descendantFolderIds);
        }

        // Update the state with the new 'where' condition
        setState(state => ({
            ...state,
            where: {
                createdBy: props.own ? identity!.id : undefined,
                ...locationWhere,
                ...state.filters
            }
        }));
    }, [state.searchQuery, state.filters, state.folderId, props.own, identity]);

    useEffect(() => {
        // Determine if there is an active search or filters
        const isSearch = Boolean(
            state.searchQuery ||
                (state.filters && Object.values(state.filters).filter(Boolean).length)
        );

        // Update the state with the new 'isSearch' condition
        setState(state => ({ ...state, isSearch }));
    }, [state.searchQuery, state.filters]);

    /**
     * Any time we receive new useful `state` params:
     * - we fetch records according to the new params
     */
    useEffect(() => {
        const listItems = async () => {
            if (!state.folderId) {
                return;
            }

            let locationWhere = dotPropImmutable.set({}, folderIdPath, state.folderId);

            if (state.isSearch) {
                if (state.folderId === ROOT_FOLDER) {
                    locationWhere = undefined;
                } else {
                    // Get descendant folders and set them in 'locationWhere'
                    const descendantFolderIds = getDescendantFolders(state.folderId).map(
                        folder => folder.id
                    );

                    console.log("descendantFolderIds", descendantFolderIds);

                    locationWhere = state.where;
                }
            }

            const params: ListSearchRecordsQueryVariables = {
                limit: state.limit,
                sort: validateOrGetDefaultDbSort(state.listSort),
                search: state.searchQuery,
                after: state.after,
                where: {
                    ...state.where,
                    ...locationWhere
                }
            };

            await listRecords(params);
        };

        listItems();
    }, [
        state.folderId,
        state.where,
        state.searchQuery,
        state.isSearch,
        state.after,
        state.listSort,
        state.limit
    ]);

    /**
     * This `useEffect` hook runs whenever the number of `records` changes
     * or the length of the `selected` array in the state changes.
     *
     * The hook checks if:
     * - There are any `records` available (i.e., `records.length` is not zero)
     * - The length of `records` is equal to the length of the `selected` array in the state
     *
     * If both conditions are true, it sets the `showingSelectAll` state to true.
     * Otherwise, it sets `showingSelectAll` to false.
     */
    useEffect(() => {
        const showingSelectAll = !!records.length && records.length === state.selected.length;

        setState(state => ({
            ...state,
            isSelectedAll: false,
            showingSelectAll
        }));
    }, [records.length, state.selected.length]);

    const context: AcoListContextData<GenericSearchData> = {
        ...pick(state, [
            "isSearch",
            "where",
            "searchQuery",
            "selected",
            "showingFilters",
            "showingSelectAll",
            "selectedLength",
            "isSelectedAll"
        ]),
        folders,
        records,
        listTitle,
        isListLoading: Boolean(
            recordsLoading.INIT || foldersLoading.INIT || recordsLoading.LIST || foldersLoading.LIST
        ),
        isListLoadingMore: Boolean(recordsLoading.LIST_MORE),
        meta,
        setSearchQuery(query) {
            setState(state => ({ ...state, searchQuery: query, after: undefined }));
        },
        setFilters(data) {
            setState(state => ({ ...state, filters: data, after: undefined }));
            // Create filters object excluding entries with `undefined` values
            const filters = Object.fromEntries(
                Object.entries(data).filter(([, value]) => value !== undefined)
            );

            setState(state => ({
                ...state,
                filters: Object.keys(filters).length ? filters : undefined,
                after: undefined
            }));
        },
        setListSort(sort: ListSearchRecordsSort) {
            setState(state => ({ ...state, listSort: sort, after: undefined }));
        },
        setSelected(selected) {
            setState(state => ({ ...state, selected, selectedLength: selected.length }));
        },
        hideFilters() {
            setState(state => ({
                ...state,
                filters: undefined,
                showingFilters: false,
                after: undefined
            }));
        },
        showFilters() {
            setState(state => ({ ...state, showingFilters: true }));
        },
        selectAll() {
            setState(state => ({ ...state, isSelectedAll: true, selectedLength: meta.totalCount }));
        },
        unselectAll() {
            setState(state => ({
                ...state,
                isSelectedAll: false,
                selectedLength: state.selected.length
            }));
        },
        listMoreRecords
    };

    return <AcoListContext.Provider value={context}>{children}</AcoListContext.Provider>;
};
