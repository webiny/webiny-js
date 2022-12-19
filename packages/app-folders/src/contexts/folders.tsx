import React, { ReactNode, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";

import { apolloFetchingHandler, loadingHandler } from "~/handlers";

import {
    CREATE_FOLDER,
    DELETE_FOLDER,
    GET_FOLDER,
    LIST_FOLDERS,
    UPDATE_FOLDER
} from "~/graphql/folders.gql";

import {
    CreateFolderResponse,
    CreateFolderVariables,
    GetFolderResponse,
    GetFolderQueryVariables,
    DeleteFolderResponse,
    DeleteFolderVariables,
    FolderItem,
    ListFoldersQueryVariables,
    ListFoldersResponse,
    UpdateFolderResponse,
    UpdateFolderVariables,
    Loading,
    LoadingActions
} from "~/types";

interface FoldersContext {
    folders: Record<string, FolderItem[]>;
    loading: Loading<LoadingActions>;
    listFolders: (type: string) => Promise<FolderItem[]>;
    getFolder: (id: string) => Promise<FolderItem>;
    createFolder: (folder: Omit<FolderItem, "id">) => Promise<FolderItem>;
    updateFolder: (folder: FolderItem) => Promise<FolderItem>;
    deleteFolder(folder: FolderItem): Promise<true>;
}

export const FoldersContext = React.createContext<FoldersContext | undefined>(undefined);

interface Props {
    children: ReactNode;
}

const defaultLoading = {
    IDLE: true,
    LIST: false,
    CREATE: false,
    UPDATE: false,
    DELETE: false
};

export const FoldersProvider = ({ children }: Props) => {
    const client = useApolloClient();
    const [folders, setFolders] = useState<Record<string, FolderItem[]>>(Object.create(null));
    const [loading, setLoading] = useState<Loading<LoadingActions>>(defaultLoading);

    const context: FoldersContext = {
        folders,
        loading,
        async listFolders(type: string) {
            if (!type) {
                throw new Error("Folder `type` is mandatory");
            }

            setLoading(prev => {
                return {
                    ...prev,
                    LIST: true
                };
            });

            const { data: response } = await client.query<
                ListFoldersResponse,
                ListFoldersQueryVariables
            >({
                query: LIST_FOLDERS,
                variables: { type }
            });

            const { data, error } = response.folders.listFolders;

            if (!data) {
                throw new Error(error?.message || "Could not fetch folders");
            }

            setFolders(folders => ({
                ...folders,
                [type]: data || []
            }));

            setLoading(prev => ({
                ...prev,
                LIST: false,
                IDLE: false
            }));

            return data;
        },

        async getFolder(id) {
            if (!id) {
                throw new Error("Folder `id` is mandatory");
            }

            const { data: response } = await apolloFetchingHandler(
                () => loadingHandler("GET", setLoading),
                () =>
                    client.query<GetFolderResponse, GetFolderQueryVariables>({
                        query: GET_FOLDER,
                        variables: { id }
                    })
            );

            const { data, error } = response.folders.getFolder;

            if (!data) {
                throw new Error(error?.message || `Could not fetch folder with id: ${id}`);
            }

            return data;
        },

        async createFolder(folder) {
            const { type } = folder;

            const { data: response } = await apolloFetchingHandler(
                () => loadingHandler("CREATE", setLoading),
                () =>
                    client.mutate<CreateFolderResponse, CreateFolderVariables>({
                        mutation: CREATE_FOLDER,
                        variables: { data: folder }
                    })
            );

            if (!response) {
                throw new Error("Network error while creating folder");
            }

            const { data, error } = response.folders.createFolder;

            if (!data) {
                throw new Error(error?.message || "Could not create folder");
            }

            setFolders(folders => ({ ...folders, [type]: [...folders[type], data] }));

            return data;
        },

        async updateFolder(folder) {
            const { id, type, name, slug, parentId } = folder;

            const { data: response } = await apolloFetchingHandler(
                () => loadingHandler("UPDATE", setLoading),
                () =>
                    client.mutate<UpdateFolderResponse, UpdateFolderVariables>({
                        mutation: UPDATE_FOLDER,
                        variables: {
                            id,
                            data: {
                                name,
                                slug,
                                parentId
                            }
                        }
                    })
            );

            if (!response) {
                throw new Error("Network error while updating folder");
            }

            const { data, error } = response.folders.updateFolder;

            if (!data) {
                throw new Error(error?.message || "Could not update folder");
            }

            setFolders(folders => {
                const folderIndex = folders[type].findIndex(f => f.id === id);
                if (folderIndex === -1) {
                    return folders;
                }

                const typeFolders = folders[type];
                typeFolders[folderIndex] = data;

                return { ...folders, [type]: typeFolders };
            });

            return data;
        },

        async deleteFolder(folder) {
            const { id, type } = folder;

            const { data: response } = await apolloFetchingHandler(
                () => loadingHandler("DELETE", setLoading),
                () =>
                    client.mutate<DeleteFolderResponse, DeleteFolderVariables>({
                        mutation: DELETE_FOLDER,
                        variables: { id }
                    })
            );

            if (!response) {
                throw new Error("Network error while deleting folder");
            }

            const { data, error } = response.folders.deleteFolder;

            if (!data) {
                throw new Error(error?.message || "Could not delete folder");
            }

            setFolders(folders => {
                const updatedFolders = folders[type].filter(f => f.id !== id);
                return { ...folders, [type]: updatedFolders };
            });

            return true;
        }
    };

    return <FoldersContext.Provider value={context}>{children}</FoldersContext.Provider>;
};
