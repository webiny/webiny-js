import React, { ReactNode, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";

import { CREATE_FOLDER, DELETE_FOLDER, LIST_FOLDERS, UPDATE_FOLDER } from "~/graphql/folders.gql";

import {
    CreateFolderResponse,
    CreateFolderVariables,
    DeleteFolderResponse,
    DeleteFolderVariables,
    FolderItem,
    ListFoldersQueryVariables,
    ListFoldersResponse,
    LoadingActions,
    UpdateFolderResponse,
    UpdateFolderVariables
} from "~/types";

const loadingDefault = {
    LIST_FOLDERS: false,
    CREATE_FOLDER: false,
    UPDATE_FOLDER: false,
    DELETE_FOLDER: false
};

interface FoldersContext {
    folders: Record<string, FolderItem[]>;
    loading: Record<LoadingActions, boolean>;
    listFolders: (type: string) => Promise<FolderItem[]>;
    createFolder: (folder: Omit<FolderItem, "id">) => Promise<FolderItem>;
    updateFolder: (folder: FolderItem) => Promise<FolderItem>;
    deleteFolder(folder: FolderItem): Promise<true>;
}

export const FoldersContext = React.createContext<FoldersContext | undefined>(undefined);

interface Props {
    children: ReactNode;
}

export const FoldersProvider = ({ children }: Props) => {
    const client = useApolloClient();
    const [folders, setFolders] = useState<Record<string, FolderItem[]>>({});
    const [loading, setLoading] = useState<Record<LoadingActions, boolean>>(loadingDefault);

    const context: FoldersContext = {
        folders,
        loading,
        async listFolders(type: string) {
            if (!type) {
                throw new Error("Folder `type` is mandatory");
            }

            setLoading({
                ...loading,
                LIST_FOLDERS: true
            });

            const { data: response } = await client.query<
                ListFoldersResponse,
                ListFoldersQueryVariables
            >({
                query: LIST_FOLDERS,
                variables: { type }
            });

            setLoading({
                ...loading,
                LIST_FOLDERS: false
            });

            const { data, error } = response.folders.listFolders;

            // TODO @webiny/error package
            if (!data) {
                throw new Error(error?.message || "Could not fetch folders");
            }

            setFolders({
                ...folders,
                [type]: data || []
            });

            return data;
        },

        async createFolder(folder) {
            const { type } = folder;

            setLoading({
                ...loading,
                CREATE_FOLDER: true
            });

            const { data: response } = await client.mutate<
                CreateFolderResponse,
                CreateFolderVariables
            >({
                mutation: CREATE_FOLDER,
                variables: { data: folder }
            });

            if (!response) {
                throw new Error("Network error while creating folder");
            }

            const { data, error } = response.folders.createFolder;

            // TODO @webiny/error package
            if (!data) {
                throw new Error(error?.message || "Could not create folder");
            }

            setFolders(folders => ({ ...folders, [type]: [...folders[type], data] }));

            setLoading({
                ...loading,
                CREATE_FOLDER: false
            });

            return data;
        },

        async updateFolder(folder) {
            const { id, type, ...rest } = folder;

            setLoading({
                ...loading,
                UPDATE_FOLDER: true
            });

            const { data: response } = await client.mutate<
                UpdateFolderResponse,
                UpdateFolderVariables
            >({
                mutation: UPDATE_FOLDER,
                variables: { id, data: rest }
            });

            if (!response) {
                throw new Error("Network error while updating folder");
            }

            const { data, error } = response.folders.updateFolder;

            // TODO @webiny/error package
            if (!data) {
                throw new Error(error?.message || "Could not update folder");
            }

            setFolders(folders => {
                const folderIndex = folders[type].findIndex(f => f.id === id);
                if (folderIndex === -1) {
                    return folders;
                }

                // Set the updated folder into the state
                const typeFolders = [...folders[type]];
                typeFolders[folderIndex] = data;

                return { ...folders, [type]: typeFolders };
            });

            setLoading({
                ...loading,
                UPDATE_FOLDER: false
            });

            return data;
        },

        async deleteFolder(folder) {
            const { id } = folder;

            setLoading({
                ...loading,
                DELETE_FOLDER: true
            });

            const { data: response } = await client.mutate<
                DeleteFolderResponse,
                DeleteFolderVariables
            >({
                mutation: DELETE_FOLDER,
                variables: { id }
            });

            if (!response) {
                throw new Error("Network error while deleting folder");
            }

            const { data, error } = response.folders.deleteFolder;

            // TODO @webiny/error package
            if (!data) {
                throw new Error(error?.message || "Could not delete folder");
            }

            setLoading({
                ...loading,
                DELETE_FOLDER: false
            });

            return true;
        }
    };

    return <FoldersContext.Provider value={context}>{children}</FoldersContext.Provider>;
};
