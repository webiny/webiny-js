import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
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
    UpdateFolderResponse,
    UpdateFolderVariables
} from "~/types";
import { ROOT_FOLDER } from "~/constants";

interface OffCacheUpdate {
    (): void;
}

export interface OnCacheUpdate {
    (folders: FolderItem[]): void;
}

export interface FoldersApiContext {
    listFolders: (
        type: string,
        options?: Partial<{ invalidateCache: boolean }>
    ) => Promise<FolderItem[]>;
    getFolder: (type: string, id: string) => Promise<FolderItem>;
    createFolder: (type: string, folder: Omit<FolderItem, "id" | "type">) => Promise<FolderItem>;
    updateFolder: (
        type: string,
        folder: Omit<
            FolderItem,
            | "type"
            | "canManagePermissions"
            | "canManageStructure"
            | "canManageContent"
            | "hasNonInheritedPermissions"
            | "createdOn"
            | "createdBy"
            | "savedOn"
            | "savedBy"
            | "modifiedOn"
            | "modifiedBy"
        >
    ) => Promise<FolderItem>;

    deleteFolder(type: string, id: string): Promise<true>;

    invalidateCache(folderType: string): FoldersApiContext;

    getDescendantFolders(type: string, id?: string): FolderItem[];

    onFoldersChanged(type: string, cb: OnCacheUpdate): OffCacheUpdate;
}

export const FoldersApiContext = React.createContext<FoldersApiContext | undefined>(undefined);

interface Props {
    children: ReactNode;
}

const rootFolder: FolderItem = {
    id: ROOT_FOLDER,
    title: "Home",
    permissions: [],
    parentId: "0",
    slug: "",
    createdOn: "",
    createdBy: {
        id: "",
        displayName: "",
        type: ""
    },
    hasNonInheritedPermissions: false,
    canManagePermissions: true,
    canManageStructure: true,
    canManageContent: true,
    savedOn: "",
    savedBy: {
        id: "",
        displayName: "",
        type: ""
    },
    modifiedOn: null,
    modifiedBy: null,
    type: "$ROOT"
};

interface FoldersByType {
    [type: string]: FolderItem[];
}

export const FoldersApiProvider = ({ children }: Props) => {
    const client = useApolloClient();
    const folderObservers = useRef(new Map<string, Set<OnCacheUpdate>>());
    const [cache, setCache] = useState<FoldersByType>({});

    useEffect(() => {
        folderObservers.current.forEach((observers, type) => {
            observers.forEach(observer => observer(cache[type]));
        });
    }, [cache]);

    useEffect(() => {
        return () => {
            folderObservers.current.clear();
        };
    }, []);

    const context: FoldersApiContext = {
        onFoldersChanged: (type, cb) => {
            if (!folderObservers.current.has(type)) {
                folderObservers.current.set(type, new Set());
            }

            folderObservers.current.get(type)!.add(cb);
            return () => {
                folderObservers.current.get(type)?.delete(cb);
            };
        },
        invalidateCache: folderType => {
            setCache(cache => {
                const cacheClone = structuredClone(cache);
                delete cacheClone[folderType];
                return cacheClone;
            });
            return context;
        },
        async listFolders(type, options) {
            const invalidateCache = options?.invalidateCache === true;
            if (cache[type] && !invalidateCache) {
                return cache[type];
            }

            const { data: response } = await client.query<
                ListFoldersResponse,
                ListFoldersQueryVariables
            >({
                query: LIST_FOLDERS,
                variables: {
                    type,
                    limit: 10000
                },
                fetchPolicy: "network-only"
            });

            if (!response) {
                throw new Error("Network error while listing folders.");
            }

            const { data, error } = response.aco.listFolders;

            if (!data) {
                throw new Error(error?.message || "Could not fetch folders");
            }

            const foldersWithRoot = [rootFolder, ...(data || [])];

            setCache(cache => ({
                ...cache,
                [type]: foldersWithRoot
            }));

            return foldersWithRoot;
        },

        async getFolder(type, id) {
            if (!id) {
                throw new Error("Folder `id` is mandatory");
            }

            const folder = cache[type]?.find(folder => folder.id === id);
            if (folder) {
                return folder;
            }

            const { data: response } = await client.query<
                GetFolderResponse,
                GetFolderQueryVariables
            >({
                query: GET_FOLDER,
                variables: { id }
            });

            if (!response) {
                throw new Error("Network error while fetch folder.");
            }

            const { data, error } = response.aco.getFolder;

            if (!data) {
                throw new Error(error?.message || `Could not fetch folder with id: ${id}`);
            }

            return data;
        },

        async createFolder(type, folder) {
            const { data: response } = await client.mutate<
                CreateFolderResponse,
                CreateFolderVariables
            >({
                mutation: CREATE_FOLDER,
                variables: {
                    data: {
                        ...folder,
                        type
                    }
                }
            });

            if (!response) {
                throw new Error("Network error while creating folder.");
            }

            const { data, error } = response.aco.createFolder;

            if (!data) {
                throw new Error(error?.message || "Could not create folder");
            }

            setCache(cache => ({
                ...cache,
                [type]: [...cache[type], data]
            }));

            return data;
        },

        async updateFolder(type, folder) {
            const { id, title, slug, permissions, parentId } = folder;

            const { data: response } = await client.mutate<
                UpdateFolderResponse,
                UpdateFolderVariables
            >({
                mutation: UPDATE_FOLDER,
                variables: {
                    id,
                    data: {
                        title,
                        slug,
                        permissions,
                        parentId
                    }
                }
            });

            if (!response) {
                throw new Error("Network error while updating folder.");
            }

            const { data, error } = response.aco.updateFolder;

            if (!data) {
                throw new Error(error?.message || "Could not update folder");
            }

            const folderIndex = cache[type]?.findIndex(f => f.id === id);
            if (folderIndex > -1) {
                setCache(cache => ({
                    ...cache,
                    [type]: [
                        ...cache[type].slice(0, folderIndex),
                        {
                            ...cache[type][folderIndex],
                            ...data
                        },
                        ...cache[type].slice(folderIndex + 1)
                    ]
                }));
            }

            return data;
        },

        async deleteFolder(type, id) {
            const { data: response } = await client.mutate<
                DeleteFolderResponse,
                DeleteFolderVariables
            >({
                mutation: DELETE_FOLDER,
                variables: {
                    id
                }
            });

            if (!response) {
                throw new Error("Network error while deleting folder");
            }

            const { data, error } = response.aco.deleteFolder;

            if (!data) {
                throw new Error(error?.message || "Could not delete folder");
            }

            setCache(cache => ({
                ...cache,
                [type]: cache[type].filter(f => f.id !== id)
            }));

            return true;
        },

        getDescendantFolders(type, id) {
            const currentFolders = cache[type];

            if (!id || id === ROOT_FOLDER || !currentFolders?.length) {
                return [];
            }

            const folderMap = new Map(currentFolders.map(folder => [folder.id, folder]));
            const result: FolderItem[] = [];

            const findChildren = (folderId: string) => {
                const folder = folderMap.get(folderId);
                if (!folder) {
                    return;
                }

                result.push(folder);

                currentFolders.forEach(child => {
                    if (child.parentId === folder.id) {
                        findChildren(child.id);
                    }
                });
            };

            findChildren(id);

            return result;
        }
    };

    return <FoldersApiContext.Provider value={context}>{children}</FoldersApiContext.Provider>;
};
