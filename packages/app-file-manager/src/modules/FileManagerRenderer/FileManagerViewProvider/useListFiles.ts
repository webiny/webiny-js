import isEqual from "lodash/isEqual";
import { validateOrGetDefaultDbSort } from "@webiny/app-aco/sorting";
import { useFolders } from "@webiny/app-aco";
import { ListMeta } from "@webiny/app-aco/types";
import { useSecurity } from "@webiny/app-security";
import { FileItem } from "@webiny/app-admin/types";
import { useStateIfMounted } from "@webiny/app-admin";
import { Loading, LoadingActions } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import {
    ListFilesQueryVariables,
    ListFilesSort,
    ListFilesWhereLocation,
    ListFilesWhereQueryVariables
} from "~/modules/FileManagerApiProvider/graphql";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";
import { getScopeWhereParams, State } from "./state";
import { ROOT_FOLDER } from "~/constants";

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
}

export function useListFiles({ modifiers, folderId, state }: UseListFilesParams) {
    const { identity } = useSecurity();
    const fileManager = useFileManagerApi();
    const { getDescendantFolders } = useFolders();
    const [meta, setMeta] = useStateIfMounted<ListMeta | undefined>(undefined);
    const [files, setFiles] = useStateIfMounted<FileItem[]>([]);
    const [loading, setLoading] = useStateIfMounted<Loading<LoadingActions>>({});
    const [lastSort, setLastSort] = useStateIfMounted<ListFilesSort | undefined>(undefined);

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

        setFiles(prev => {
            // If there's no cursor, or sorting changed, it means we're receiving a new list of files from scratch.
            if (!after || !isEqual(sorting, lastSort)) {
                return fmResponse.files;
            }

            // Otherwise, we're merging results with the previous state.
            return [...prev, ...fmResponse.files];
        });

        // We need to keep track of the last used sorting. If sorting is changed, it means we're loading
        // a completely new list of files (starting from "page 1").
        setLastSort(sorting);

        setMeta(fmResponse.meta);

        setLoading(prev => {
            return {
                ...prev,
                INIT: false,
                [action]: false
            };
        });
    };

    const getListVariables = () => {
        const isSearch = state.searchQuery || state.filters || state.activeTags.length;

        const AND: ListFilesWhereQueryVariables[] = [];

        if (state.filters) {
            AND.push(state.filters);
        }

        if (state.activeTags.length) {
            if (state.tagsFilterMode == "OR") {
                AND.push({ tags_in: state.activeTags });
            } else {
                AND.push(...state.activeTags.map(tag => ({ tags_in: [tag] })));
            }
        }

        let locationWhere: ListFilesWhereLocation | undefined = { folderId };

        if (isSearch) {
            if (folderId === ROOT_FOLDER) {
                locationWhere = undefined;
            } else {
                locationWhere = {
                    folderId_in: getDescendantFolders(folderId).map(folder => folder.id)
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
