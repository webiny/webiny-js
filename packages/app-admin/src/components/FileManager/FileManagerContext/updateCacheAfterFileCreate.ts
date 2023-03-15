import { MutationUpdaterFn } from "apollo-client";
import {
    CreateFileMutationResponse,
    LIST_FILES,
    ListFilesQueryResponse
} from "~/components/FileManager/graphql";
import { StateQueryParams } from "~/components/FileManager/FileManagerContext/stateReducer";

export const updateCacheAfterFileCreate =
    (queryParams: StateQueryParams): MutationUpdaterFn<CreateFileMutationResponse> =>
    (cache, response) => {
        if (!response.data) {
            return;
        }
        const newFileData = response.data.fileManager.createFile.data;

        const data = cache.readQuery<ListFilesQueryResponse>({
            query: LIST_FILES,
            variables: queryParams
        });

        cache.writeQuery({
            query: LIST_FILES,
            variables: queryParams,
            data: {
                fileManager: {
                    ...(data?.fileManager || {}),
                    listFiles: {
                        ...(data?.fileManager || {}).listFiles,
                        data: [newFileData, ...((data?.fileManager?.listFiles || {}).data || [])]
                    }
                }
            }
        });
    };
