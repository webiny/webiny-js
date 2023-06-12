import { sortTableItems, validateOrGetDefaultDbSort } from "@webiny/app-aco/sorting";
import sortBy from "lodash/sortBy";
import { ListMeta } from "@webiny/app-aco/types";
import { FileItem } from "@webiny/app-admin/types";
import { useState } from "react";
import { Loading, LoadingActions } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { ListFilesQueryVariables } from "~/modules/FileManagerApiProvider/graphql";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";

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

export function useListFiles() {
    const fileManager = useFileManagerApi();
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
    };

    return {
        files,
        loading,
        meta,
        setFiles,
        listFiles
    };
}
