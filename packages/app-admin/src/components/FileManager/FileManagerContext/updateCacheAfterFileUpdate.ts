import { MutationUpdaterFn } from "apollo-client";
import cloneDeep from "lodash/cloneDeep";
import {
    CreateFileMutationResponse,
    LIST_FILES,
    LIST_TAGS,
    ListFilesQueryResponse,
    ListFileTagsQueryResponse
} from "~/components/FileManager/graphql";
import { StateQueryParams } from "~/components/FileManager/FileManagerContext/stateReducer";
import { FileItem } from "~/components/FileManager/types";
import { getWhere } from "~/components/FileManager/FileManagerContext";

export const updateCacheAfterFileUpdate =
    (
        id: string,
        queryParams: StateQueryParams,
        file: Partial<FileItem>
    ): MutationUpdaterFn<CreateFileMutationResponse> =>
    cache => {
        const data = cloneDeep(
            cache.readQuery<ListFilesQueryResponse>({
                query: LIST_FILES,
                variables: queryParams
            })
        );

        if (data) {
            const fileInCache = data.fileManager.listFiles.data.find(file => file.id === id);
            if (!fileInCache) {
                return;
            }

            Object.assign(fileInCache, file);
        }

        cache.writeQuery({
            query: LIST_FILES,
            variables: queryParams,
            data: data
        });

        if (Array.isArray(file.tags)) {
            // Get list tags data
            const listTagsData = cloneDeep(
                cache.readQuery<ListFileTagsQueryResponse>({
                    query: LIST_TAGS,
                    variables: { where: getWhere(queryParams.scope) }
                })
            );
            if (!listTagsData) {
                return;
            }

            // Add new tag in list
            const updatedTagsList = [...file.tags];

            if (Array.isArray(listTagsData.fileManager.listTags)) {
                listTagsData.fileManager.listTags.forEach(tag => {
                    if (!updatedTagsList.includes(tag)) {
                        updatedTagsList.push(tag);
                    }
                });
            }

            listTagsData.fileManager.listTags = updatedTagsList;

            cache.writeQuery({
                query: LIST_TAGS,
                variables: { where: getWhere(queryParams.scope) },
                data: listTagsData
            });
        }
    };
