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
    searchQuery: string;
    isSelectedAll: boolean;
    selectAll: () => void;
    unselectAll: () => void;
    getWhere: () => Record<string, any>;
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

const getCurrentRecordList = <T extends GenericSearchData = GenericSearchData>(
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
     * Constructs a "where" condition object based on the current state and properties.
     *
     * This function creates a "where" object used to filter data based on the current folder ID,
     * ownership status, and other existing filters in the state.
     *
     * @returns {Object} A "where" condition object containing filters for querying data.
     */
    const getWhere = useCallback(() => {
        // Initialize an empty object
        let where = {};

        // Check if the current folder ID is not the ROOT_FOLDER folder
        if (state.folderId !== ROOT_FOLDER) {
            // Get descendant folder IDs of the current folder
            const descendantFolderIds = getDescendantFolders(state.folderId).map(
                folder => folder.id
            );

            // Set the locationWhere object with descendant folder IDs
            where = dotPropImmutable.set({}, folderIdInPath, descendantFolderIds);
        }

        return {
            createdBy: props.own ? identity?.id : undefined, // Set 'createdBy' based on the ownership status
            ...state.filters, // Merge existing filters into the 'where' condition
            ...where // Include where condition if applicable
        };
    }, [folders, state.folderId, state.filters, props.own, identity]);

    /**
     * Any time we receive new useful `state` params:
     * - we fetch records according to the new params
     */
    useEffect(() => {
        const listItems = async () => {
            if (!state.folderId) {
                return;
            }

            const isSearch = Boolean(
                state.searchQuery ||
                    (state.filters && Object.values(state.filters).filter(Boolean).length)
            );

            let where = dotPropImmutable.set({}, folderIdPath, state.folderId);

            // In case of a search or filters applied, let's get the where condition based on the current folder ID,
            // ownership status, and other existing filters in the state.
            if (isSearch) {
                where = getWhere();
            }

            const params: ListSearchRecordsQueryVariables = {
                limit: state.limit,
                sort: validateOrGetDefaultDbSort(state.listSort),
                search: state.searchQuery,
                after: state.after,
                where
            };

            await listRecords(params);

            setState(state => ({ ...state, isSearch }));
        };

        listItems();
    }, [
        state.folderId,
        state.filters,
        state.searchQuery,
        state.after,
        state.listSort,
        state.limit,
        props.own,
        identity
    ]);

    /**
     * useEffect hook to determine if the "Select All" option should be displayed based on the current state and meta properties:
     *  - if in the root folder with no folders, checks if all records are selected.
     *  - if in a non-root folder with multiple descendant folders, checks if all records are selected.
     *  - if there are more items to load, checks if all records are selected.
     */
    useEffect(() => {
        // Destructure relevant properties from state and meta
        const { selected, folderId } = state;
        const { hasMoreItems } = meta;

        // Retrieve all descendant folders of the current folderId
        const folderWithChildren = getDescendantFolders(folderId);

        // Compute the lengths of various arrays for later comparisons
        const foldersLength = folders.length;
        const recordsLength = records.length;
        const selectedLength = selected.length;
        const folderWithChildrenLength = folderWithChildren.length;

        // Function to determine if all records are selected
        const getAllRecordsAreSelected = () => !!recordsLength && recordsLength === selectedLength;

        // Initialize a flag to determine if the "Select All" option should be shown
        let showingSelectAll = false;

        // If in the root folder and there are some folders, check if all records are selected
        if (folderId === ROOT_FOLDER && foldersLength > 0) {
            showingSelectAll = getAllRecordsAreSelected();
        }

        // If not in the root folder and there are multiple descendant folders, check if all records are selected
        if (folderId !== ROOT_FOLDER && folderWithChildrenLength > 1) {
            showingSelectAll = getAllRecordsAreSelected();
        }

        // If there are more items to load, check if all records are selected
        if (hasMoreItems) {
            showingSelectAll = getAllRecordsAreSelected();
        }

        // Update the component's state based on the computed showingSelectAll flag
        setState(prevState => {
            // Only update if there is a change in showingSelectAll or if isSelectedAll was true previously
            if (!prevState.isSelectedAll && prevState.showingSelectAll === showingSelectAll) {
                return prevState;
            }

            // Return the new state with updated showingSelectAll and reset isSelectedAll to false
            return {
                ...prevState,
                isSelectedAll: false,
                showingSelectAll
            };
        });
    }, [
        records.length,
        folders.length,
        state.isSearch,
        meta.hasMoreItems,
        state.selected.length,
        state.folderId
    ]);

    const context: AcoListContextData<GenericSearchData> = {
        ...pick(state, [
            "isSearch",
            "searchQuery",
            "selected",
            "showingFilters",
            "showingSelectAll",
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
            setState(state => ({ ...state, selected }));
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
            setState(state => ({ ...state, isSelectedAll: true }));
        },
        unselectAll() {
            setState(state => ({
                ...state,
                selected: [],
                isSelectedAll: false
            }));
        },
        getWhere,
        listMoreRecords
    };

    return <AcoListContext.Provider value={context}>{children}</AcoListContext.Provider>;
};
