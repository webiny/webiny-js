import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@webiny/react-router";
import debounce from "lodash/debounce";
import { PAGE_BUILDER_LIST_LINK, FOLDER_ID_DEFAULT } from "~/admin/constants";
import { createSort, useAcoList, useNavigateFolder } from "@webiny/app-aco";
import { PbPageDataItem } from "~/types";
import { FolderItem, ListMeta, SearchRecordItem } from "@webiny/app-aco/types";
import { OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { TableProps } from "~/admin/components/Table/Table";

interface UsePageList {
    folders: FolderItem[];
    isListLoading: boolean;
    isListLoadingMore: boolean;
    isSearch: boolean;
    listMoreRecords: () => void;
    listTitle?: string;
    meta: ListMeta;
    onSelectRow: TableProps["onSelectRow"];
    records: SearchRecordItem<PbPageDataItem>[];
    search: string;
    selected: string[];
    setSearch: (value: string) => void;
    setSorting: OnSortingChange;
    sorting: Sorting;
}

interface UpdateSearchCallableParams {
    search: string;
    query: URLSearchParams;
}

interface UpdateSearchCallable {
    (params: UpdateSearchCallableParams): void;
}

export const usePagesList = (): UsePageList => {
    const { history } = useRouter();

    const {
        folders,
        isListLoading,
        isListLoadingMore,
        isSearch,
        listMoreRecords,
        listTitle,
        meta,
        records,
        setSearchQuery,
        setListSort
    } = useAcoList<PbPageDataItem>();
    const { currentFolderId = FOLDER_ID_DEFAULT } = useNavigateFolder();

    const [sorting, setSorting] = useState<Sorting>([]);
    const [search, setSearch] = useState<string>("");
    const [selected, setSelected] = useState<string[]>([]);

    const query = new URLSearchParams(location.search);
    const searchQuery = query.get("search") || "";

    // Search-related logics: update `listParams` and update querystring
    const updateSearch = useCallback(
        debounce<UpdateSearchCallable>(({ search, query }) => {
            const searchQuery = query.get("search");

            if (typeof searchQuery !== "string" && !search) {
                return;
            }

            if (searchQuery !== search) {
                setSearchQuery(search);

                if (!search) {
                    // In case of empty `search` - remove it from `querystring`
                    query.delete("search");
                } else {
                    // Otherwise, add it to `querystring`
                    query.set("search", search);
                }
                history.push(`${PAGE_BUILDER_LIST_LINK}?${query.toString()}`);
            }
        }, 500),
        [currentFolderId]
    );

    // Set "search" from search "query" on page load.
    useEffect(() => {
        setSearch(searchQuery);
    }, [currentFolderId, searchQuery]);

    // When "search" changes, trigger search-related logics
    useEffect(() => {
        updateSearch({ search, query });
    }, [search]);

    // Handle rows selection, receiving the full row object and setting the `row.id`, internally mapped to `page.pid`.
    const onSelectRow: TableProps["onSelectRow"] = rows => {
        const ids = rows.filter(row => row.$type === "RECORD").map(row => row.id);
        setSelected(ids);
    };

    useEffect(() => {
        if (!sorting?.length) {
            return;
        }
        const sort = createSort(sorting);
        if (!sort) {
            return;
        }
        setListSort(sort);
    }, [sorting]);

    return {
        folders,
        isListLoading,
        isListLoadingMore,
        isSearch,
        listMoreRecords,
        listTitle,
        meta,
        onSelectRow,
        records,
        search,
        selected,
        setSearch,
        setSorting,
        sorting
    };
};
