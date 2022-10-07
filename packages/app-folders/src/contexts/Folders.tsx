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
    UpdateFolderResponse,
    UpdateFolderVariables
} from "~/types";

interface FoldersContext {
    folders: Record<string, FolderItem[]>;
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

    //    const [listLoading, setListLoading] = useState<boolean>(false);

    const context: FoldersContext = {
        folders,
        async listFolders(type: string) {
            if (!type) {
                throw new Error("Folder `type` is mandatory");
            }

            const { data: response } = await client.query<
                ListFoldersResponse,
                ListFoldersQueryVariables
            >({
                query: LIST_FOLDERS,
                variables: { type }
                //fetchPolicy: useNetwork ? "network-only" : undefined
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

            return data;
        },

        async updateFolder(folder) {
            const { id, type, ...rest } = folder;

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

            return data;
        },

        async deleteFolder(folder) {
            const { id } = folder;

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

            return true;
        }
    };

    //const loading = [listLoading, updateLoading, createLoading].some(isLoading => isLoading);

    return <FoldersContext.Provider value={context}>{children}</FoldersContext.Provider>;
};
