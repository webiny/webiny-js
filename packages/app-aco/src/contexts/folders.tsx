import React, { ReactNode, useContext, useMemo, useState } from "react";

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
import { useApolloClient } from "@apollo/react-hooks";
import { AcoAppContext } from "~/contexts/app";
import { ROOT_FOLDER } from "~/constants";

interface ListFoldersParams {
    backgroundRefresh?: boolean;
}

interface FoldersContext {
    folders?: FolderItem[] | null;
    loading: Loading<LoadingActions>;
    listFolders: (params?: ListFoldersParams) => Promise<FolderItem[]>;
    getFolder: (id: string) => Promise<FolderItem>;
    createFolder: (folder: Omit<FolderItem, "id" | "type">) => Promise<FolderItem>;
    updateFolder: (folder: Omit<FolderItem, "type">) => Promise<FolderItem>;
    deleteFolder(folder: Pick<FolderItem, "id">): Promise<true>;
}

export const FoldersContext = React.createContext<FoldersContext | undefined>(undefined);

interface Props {
    type?: string;
    children: ReactNode;
}

const defaultLoading: Record<LoadingActions, boolean> = {
    INIT: true,
    LIST: false,
    LIST_MORE: false,
    GET: false,
    MOVE: false,
    CREATE: false,
    UPDATE: false,
    DELETE: false
};

const rootFolder: FolderItem = {
    id: ROOT_FOLDER,
    title: "Home",
    parentId: "0",
    slug: "",
    createdOn: "",
    createdBy: {
        id: "",
        displayName: ""
    },
    savedOn: "",
    type: "$ROOT"
};

export const FoldersProvider: React.VFC<Props> = ({ children, ...props }) => {
    const client = useApolloClient();
    const appContext = useContext(AcoAppContext);
    const app = appContext ? appContext.app : undefined;

    const type = props.type ?? app?.id;
    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const [folders, setFolders] = useState<FolderItem[] | null>(null);
    const [loading, setLoading] = useState<Loading<LoadingActions>>(defaultLoading);

    const context = useMemo<FoldersContext>(() => {
        return {
            folders,
            loading,
            async listFolders(params = {}) {
                const backgroundRefresh = params.backgroundRefresh ?? false;
                const { data: response } = await apolloFetchingHandler<ListFoldersResponse>(
                    loadingHandler("LIST", backgroundRefresh ? undefined : setLoading),
                    () =>
                        client.query<ListFoldersResponse, ListFoldersQueryVariables>({
                            query: LIST_FOLDERS,
                            variables: {
                                type,
                                limit: 10000
                            },
                            fetchPolicy: backgroundRefresh ? "network-only" : "cache-first"
                        })
                );

                if (!response) {
                    throw new Error("Network error while listing folders.");
                }

                const { data, error } = response.aco.listFolders;

                if (!data) {
                    throw new Error(error?.message || "Could not fetch folders");
                }

                const foldersWithRoot = [rootFolder, ...(data || [])];

                setFolders(() => {
                    return foldersWithRoot;
                });

                setLoading(prev => ({
                    ...prev,
                    INIT: false
                }));

                return foldersWithRoot;
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

                setFolders(prev => {
                    return [data, ...(prev || [])];
                });

                context.listFolders({ backgroundRefresh: true });

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

                setFolders(prev => {
                    if (!prev) {
                        return [];
                    }
                    const folderIndex = prev.findIndex(f => f.id === id);
                    if (folderIndex === -1) {
                        return prev;
                    }
                    const next = [...prev];
                    next[folderIndex] = data;

                    return next;
                });

                context.listFolders({ backgroundRefresh: true });

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

                setFolders(prev => {
                    if (!prev) {
                        return [];
                    }
                    return prev.filter(f => f.id !== id);
                });

                context.listFolders({ backgroundRefresh: true });

                return true;
            }
        };
    }, [folders, loading, setLoading, setFolders]);

    return <FoldersContext.Provider value={context}>{children}</FoldersContext.Provider>;
};
