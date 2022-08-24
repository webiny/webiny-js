import WebinyError from "@webiny/error";

import { FolderInput, Folders, FoldersCRUDListParams, FoldersStorageOperations } from "./types";

export const createFolders = async (
    foldersOperations: FoldersStorageOperations
): Promise<Folders> => {
    return {
        async getFolder(id: string) {
            try {
                return await foldersOperations.getFolder(id);
            } catch (error) {
                throw new WebinyError(
                    error.message || "Could not get folder by id.",
                    error.code || "GET_FOLDER_BY_ID_ERROR",
                    {
                        id
                    }
                );
            }
        },

        async listFolders(params: FoldersCRUDListParams) {
            try {
                return await foldersOperations.listFolders(params);
            } catch (error) {
                throw new WebinyError(
                    error.message || "Could not list folders.",
                    error.code || "LIST_FOLDERS_BY_TYPE_ERROR",
                    {
                        ...params
                    }
                );
            }
        },

        async createFolder(params: FolderInput) {
            try {
                return await foldersOperations.createFolder(params);
            } catch (error) {
                throw new WebinyError(
                    error.message || "Could not create folder.",
                    error.code || "CREATE_FOLDER_ERROR",
                    {
                        ...params
                    }
                );
            }
        },

        async updateFolder(id: string, params: FolderInput) {
            try {
                return await foldersOperations.updateFolder(id, params);
            } catch (error) {
                throw new WebinyError(
                    error.message || "Could not update folder.",
                    error.code || "UPDATE_FOLDER_ERROR",
                    {
                        id,
                        ...params
                    }
                );
            }
        },

        async deleteFolder(id: string) {
            try {
                return await foldersOperations.deleteFolder(id);
            } catch (error) {
                throw new WebinyError(
                    error.message || "Could not delete folder.",
                    error.code || "DELETE_FOLDER_ERROR",
                    {
                        id
                    }
                );
            }
        }
    };
};
