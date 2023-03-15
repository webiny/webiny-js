import { MutationUpdaterFn } from "apollo-client";
import set from "lodash/set";
import cloneDeep from "lodash/cloneDeep";
import {
    DeleteFileMutationResponse,
    LIST_FILES,
    LIST_TAGS,
    ListFilesQueryResponse,
    ListFileTagsQueryResponse
} from "~/components/FileManager/graphql";
import { StateQueryParams } from "~/components/FileManager/FileManagerContext/stateReducer";
import { FileItem } from "~/components/FileManager/types";
import { getWhere } from "~/components/FileManager/FileManagerContext";

export const updateCacheAfterFileDelete =
    (id: string, queryParams: StateQueryParams): MutationUpdaterFn<DeleteFileMutationResponse> =>
    cache => {
        // 1. Update files list cache
        let data = cloneDeep(
            cache.readQuery<ListFilesQueryResponse>({
                query: LIST_FILES,
                variables: queryParams
            })
        );
        if (!data) {
            data = {
                fileManager: {
                    listFiles: {
                        data: [],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalItem: 0
                        }
                    }
                }
            };
        }
        const filteredList = data.fileManager.listFiles.data.filter(item => item.id !== id);
        const selectedFile = data.fileManager.listFiles.data.find(item => item.id === id);

        cache.writeQuery({
            query: LIST_FILES,
            variables: queryParams,
            data: set(data, "fileManager.listFiles.data", filteredList)
        });
        // 2. Update "ListTags" cache
        if (!selectedFile || Array.isArray(selectedFile.tags) === false) {
            return;
        }
        const tagCountMap: Record<string, number> = {};
        // Prepare "tag" count map
        data.fileManager.listFiles.data.forEach((file: FileItem) => {
            if (!Array.isArray(file.tags)) {
                return;
            }
            file.tags.forEach(tag => {
                if (tagCountMap[tag]) {
                    tagCountMap[tag] += 1;
                } else {
                    tagCountMap[tag] = 1;
                }
            });
        });

        // Get tags from cache
        const listTagsData = cloneDeep(
            cache.readQuery<ListFileTagsQueryResponse>({
                query: LIST_TAGS,
                variables: { where: getWhere(queryParams.scope) }
            })
        );
        // Remove selected file tags from list.
        const filteredTags = (listTagsData?.fileManager?.listTags || []).filter((tag: string) => {
            if (!selectedFile.tags.includes(tag)) {
                return true;
            }
            return tagCountMap[tag] > 1;
        });

        // Write it to cache
        cache.writeQuery({
            query: LIST_TAGS,
            variables: { where: getWhere(queryParams.scope) },
            data: set(data, "fileManager.listTags", filteredTags)
        });
    };
