import React, { ReactNode, useMemo, useState } from "react";
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
    DeleteFolderResponse,
    DeleteFolderVariables,
    FolderItem,
    GetFolderQueryVariables,
    GetFolderResponse,
    ListFoldersQueryVariables,
    ListFoldersResponse,
    Loading,
    LoadingActions,
    UpdateFolderResponse,
    UpdateFolderVariables
} from "~/types";
import { useAcoApp } from "~/hooks";

interface FoldersContext {
    folders?: FolderItem[] | null;
    loading: Loading<LoadingActions>;
    listFolders: () => Promise<FolderItem[]>;
    getFolder: (id: string) => Promise<FolderItem>;
    createFolder: (folder: Omit<FolderItem, "id" | "type">) => Promise<FolderItem>;
    updateFolder: (folder: Omit<FolderItem, "type">) => Promise<FolderItem>;
    deleteFolder(folder: Pick<FolderItem, "id">): Promise<true>;
}

export const FoldersContext = React.createContext<FoldersContext | undefined>(undefined);

interface Props {
    children: ReactNode;
}

const defaultLoading: Record<LoadingActions, boolean> = {
    INIT: true,
    LIST: false,
    LIST_MORE: false,
    GET: false,
    CREATE: false,
    UPDATE: false,
    DELETE: false
};

export const FoldersProvider: React.VFC<Props> = ({ children }) => {
    const client = useApolloClient();
    const { app } = useAcoApp();
    const type = app.id;
    const [folders, setFolders] = useState<FolderItem[] | null>(null);
    const [loading, setLoading] = useState<Loading<LoadingActions>>(defaultLoading);

    const context = useMemo<FoldersContext>(() => {
        return {
            folders,
            loading,
            async listFolders() {
                const { data: response } = await apolloFetchingHandler<ListFoldersResponse>(
                    loadingHandler("LIST", setLoading),
                    () =>
                        client.query<ListFoldersResponse, ListFoldersQueryVariables>({
                            query: LIST_FOLDERS,
                            variables: {
                                type: app.id,
                                limit: 10000
                            }
                        })
                );

                if (!response) {
                    throw new Error("Network error while listing folders.");
                }

                const { data, error } = response.aco.listFolders;

                if (!data) {
                    throw new Error(error?.message || "Could not fetch folders");
                }

                setFolders(data || []);

                setLoading(prev => ({
                    ...prev,
                    INIT: false
                }));

                return data;
            },

            async getFolder(id) {
                if (!id) {
                    throw new Error("Folder `id` is mandatory");
                }

                const { data: response } = await apolloFetchingHandler<GetFolderResponse>(
                    loadingHandler("GET", setLoading),
                    () =>
                        client.query<GetFolderResponse, GetFolderQueryVariables>({
                            query: GET_FOLDER,
                            variables: { id }
                        })
                );

                if (!response) {
                    throw new Error("Network error while fetch folder.");
                }

                const { data, error } = response.aco.getFolder;

                if (!data) {
                    throw new Error(error?.message || `Could not fetch folder with id: ${id}`);
                }

                return data;
            },

            async createFolder(folder) {
                const { data: response } = await apolloFetchingHandler(
                    loadingHandler("CREATE", setLoading),
                    () =>
                        client.mutate<CreateFolderResponse, CreateFolderVariables>({
                            mutation: CREATE_FOLDER,
                            variables: {
                                data: {
                                    ...folder,
                                    type
                                }
                            }
                        })
                );

                if (!response) {
                    throw new Error("Network error while creating folder.");
                }

                const { data, error } = response.aco.createFolder;

                if (!data) {
                    throw new Error(error?.message || "Could not create folder");
                }

                setFolders(folders => {
                    return [data, ...(folders || [])];
                });

                return data;
            },

            async updateFolder(folder) {
                const { id, title, slug, parentId } = folder;

                const { data: response } = await apolloFetchingHandler(
                    loadingHandler("UPDATE", setLoading),
                    () =>
                        client.mutate<UpdateFolderResponse, UpdateFolderVariables>({
                            mutation: UPDATE_FOLDER,
                            variables: {
                                id,
                                data: {
                                    title,
                                    slug,
                                    parentId
                                }
                            }
                        })
                );

                if (!response) {
                    throw new Error("Network error while updating folder.");
                }

                const { data, error } = response.aco.updateFolder;

                if (!data) {
                    throw new Error(error?.message || "Could not update folder");
                }

                setFolders(folders => {
                    if (!folders) {
                        return [];
                    }
                    const folderIndex = folders.findIndex(f => f.id === id);
                    if (folderIndex === -1) {
                        return folders;
                    }

                    folders[folderIndex] = data;

                    return folders;
                });

                return data;
            },

            async deleteFolder(folder) {
                const { id } = folder;

                const { data: response } = await apolloFetchingHandler(
                    loadingHandler("DELETE", setLoading),
                    () =>
                        client.mutate<DeleteFolderResponse, DeleteFolderVariables>({
                            mutation: DELETE_FOLDER,
                            variables: {
                                id
                            }
                        })
                );

                if (!response) {
                    throw new Error("Network error while deleting folder");
                }

                const { data, error } = response.aco.deleteFolder;

                if (!data) {
                    throw new Error(error?.message || "Could not delete folder");
                }

                setFolders(folders => {
                    return (folders || []).filter(f => f.id !== id);
                });

                return true;
            }
        };
    }, [folders, type, loading, setFolders]);

    return <FoldersContext.Provider value={context}>{children}</FoldersContext.Provider>;
};
