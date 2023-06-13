import { sortTableItems, validateOrGetDefaultDbSort } from "@webiny/app-aco/sorting";
import sortBy from "lodash/sortBy";
import { useFolders } from "@webiny/app-aco";
import { ListMeta } from "@webiny/app-aco/types";
import { useSecurity } from "@webiny/app-security";
import { FileItem } from "@webiny/app-admin/types";
import { useRef, useState } from "react";
import { Loading, LoadingActions } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import {
    ListFilesQueryVariables,
    ListFilesWhereLocation,
    ListFilesWhereQueryVariables
} from "~/modules/FileManagerApiProvider/graphql";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";
import { getScopeWhereParams, State } from "./state";

const mergeRecords = (oldRecords: FileItem[], newRecords: FileItem[]): FileItem[] => {
    if (!newRecords.length) {
        return oldRecords;
    }

    const mergedRecords = newRecords.reduce(
        (items, record) => {
            const index = items.findIndex(item => item.id === record.id);
            if (index === -1) {
                items.push(record);
                return items;
            }
            items[index] = record;
            return items;
        },
        [...oldRecords]
    ); // merge the two arrays

    return sortBy(mergedRecords, ["name"]);
};

function nonEmptyArray(value: string[] | undefined, fallback: string[] | undefined = undefined) {
    if (Array.isArray(value)) {
        return value.length ? value : undefined;
    }

    return fallback;
}

interface UseListFilesParams {
    modifiers: {
        scope?: string;
        own?: boolean;
        accept: string[];
    };
    folderId: string;
    state: State;
    onFirstLoad: (meta: ListMeta) => void;
}

export function useListFiles({ modifiers, folderId, state, onFirstLoad }: UseListFilesParams) {
    const { identity } = useSecurity();
    const fileManager = useFileManagerApi();
    const { getDescendantFolders } = useFolders();
    const firstLoad = useRef(true);
    const [meta, setMeta] = useState<ListMeta | undefined>(undefined);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState<Loading<LoadingActions>>({});

    const listFiles = async (params: ListFilesQueryVariables) => {
        const { after, limit, sort: sorting, search, where } = params;

        /*
         * We're avoiding to fetch records in case they have already been fetched.
         * This happens when visiting a list with all records loaded and receives "after" param.
         */
        const hasMoreItems = meta?.hasMoreItems || true;
        if (after && !hasMoreItems) {
            return;
        }

        // Remove records in case of sorting change and not a paginated request.
        if (sorting && !after) {
            setFiles([]);
        }

        const action = after ? "LIST_MORE" : "LIST";
        const sort = validateOrGetDefaultDbSort(sorting);

        setLoading({ [action]: true });

        const fmResponse = await fileManager.listFiles({
            where,
            sort,
            search,
            limit,
            after
        });

        setLoading({ [action]: false });

        setFiles(prev => {
            /**
             * In case of paginated request, we merge the fetched records with the existing ones, and then sort them.
             * Otherwise, we sort the fetched records and set them as the new records.
             */
            return sortTableItems(mergeRecords(after ? prev : [], fmResponse.files), sort);
        });

        setMeta(fmResponse.meta);

        setLoading(prev => {
            return {
                ...prev,
                INIT: false
            };
        });

        if (firstLoad.current) {
            firstLoad.current = false;
            onFirstLoad(fmResponse.meta);
        }
    };

    const getListVariables = () => {
        const isSearch = state.searchQuery || state.filters || state.activeTags.length;

        const AND: ListFilesWhereQueryVariables[] = [];

        if (state.filters) {
            AND.push(state.filters);
        }

        if (state.activeTags.length) {
            AND.push({ tags_in: state.activeTags });
        }

        let locationWhere: ListFilesWhereLocation | undefined = { folderId };

        if (isSearch) {
            if (folderId === "ROOT") {
                locationWhere = undefined;
            } else {
                locationWhere = {
                    folderId_in: getDescendantFolders(folderId)
                };
            }
        }

        const queryParams: ListFilesQueryVariables = {
            limit: 50,
            sort: state.listSort,
            search: state.searchQuery || undefined,
            where: {
                ...getScopeWhereParams(modifiers.scope),
                location: locationWhere,
                createdBy: modifiers.own ? identity!.id : undefined,
                type_in: nonEmptyArray(modifiers.accept),
                AND: AND.length > 0 ? AND : undefined
            }
        };

        return queryParams;
    };

    return {
        files: files || [],
        loading,
        meta,
        setFiles,
        listFiles,
        getListVariables
    };
}
