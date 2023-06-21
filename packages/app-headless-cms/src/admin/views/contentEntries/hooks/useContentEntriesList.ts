import { useCallback, useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import { useRouter } from "@webiny/react-router";
import { useContentEntries } from "./useContentEntries";
import { CmsContentEntry } from "~/types";
import { OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { useAcoList, useFolders } from "@webiny/app-aco";
import { CMS_ENTRY_LIST_LINK } from "~/admin/constants";
import { ListMeta } from "@webiny/app-aco/types";
import {
    transformCmsContentEntriesToRecordEntries,
    transformFolderItemsToFolderEntries
} from "~/utils/acoRecordTransform";
import { FolderEntry, RecordEntry } from "~/admin/components/ContentEntries/Table/types";

interface UpdateSearchCallableParams {
    search: string;
    query: URLSearchParams;
}
interface UpdateSearchCallable {
    (params: UpdateSearchCallableParams): void;
}

interface UseContentEntriesListParams {
    folderId?: string;
}

interface UseContentEntries {
    folders: FolderEntry[];
    isListLoading: boolean;
    isListLoadingMore: boolean;
    isSearch: boolean;
    listTitle?: string;
    listMoreRecords: () => void;
    meta: ListMeta;
    records: RecordEntry[];
    search: string;
    setSearch: (value: string) => void;
    setSorting: OnSortingChange;
    sorting: Sorting;
}

export const useContentEntriesList = ({
    folderId
}: UseContentEntriesListParams): UseContentEntries => {
    const { history } = useRouter();
    const { contentModel } = useContentEntries();
    const { getDescendantFolders } = useFolders();
    const {
        folders: initialFolders,
        isListLoading,
        isListLoadingMore,
        isSearch,
        listMoreRecords,
        listTitle,
        meta,
        records: initialRecords,
        setListParams,
        sorting,
        setSorting
    } = useAcoList({ folderId });

    const [search, setSearch] = useState<string>("");

    const query = new URLSearchParams(location.search);
    const searchQuery = query.get("search") || "";
    const baseUrl = `${CMS_ENTRY_LIST_LINK}/${contentModel.modelId}`;

    // Search-related logics: update `listParams` and update querystring
    const updateSearch = useCallback(
        debounce<UpdateSearchCallable>(({ search, query }) => {
            const searchQuery = query.get("search");

            if (typeof searchQuery !== "string" && !search) {
                return;
            }

            let wbyAco_location;
            if (search) {
                /**
                 * In case of search:
                 * - in case we are inside a folder, pass the descendent folders id
                 * - otherwhise, remove `location` and search across all records
                 */
                const folderIds = getDescendantFolders(folderId).map(folder => folder.id);
                if (folderIds?.length) {
                    wbyAco_location = { folderId_in: folderIds };
                }
            } else {
                wbyAco_location = { folderId };
            }

            setListParams({ search, where: { wbyAco_location } });

            if (searchQuery !== search) {
                if (!search) {
                    // In case of empty `search` - remove it from `querystring`
                    query.delete("search");
                } else {
                    // Otherwise, add it to `querystring`
                    query.set("search", search);
                }
                history.push(`${baseUrl}?${query.toString()}`);
            }
        }, 500),
        [baseUrl, folderId]
    );

    // Set "search" from search "query" on page load.
    useEffect(() => {
        setSearch(searchQuery);
    }, [baseUrl, folderId, searchQuery]);

    // When "search" changes, trigger search-related logics
    useEffect(() => {
        updateSearch({ search, query });
    }, [search]);

    const records = useMemo(() => {
        return transformCmsContentEntriesToRecordEntries(
            initialRecords as unknown as CmsContentEntry[]
        );
    }, [initialRecords]);

    const folders = useMemo(() => {
        return transformFolderItemsToFolderEntries(initialFolders);
    }, [initialFolders]);

    return {
        folders,
        isListLoading,
        isListLoadingMore,
        isSearch,
        listTitle,
        listMoreRecords,
        meta,
        records,
        search,
        setSearch,
        sorting,
        setSorting
    };
};
