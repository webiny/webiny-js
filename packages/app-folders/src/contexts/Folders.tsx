import React, { useMemo, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/react-hooks";
import get from "lodash.get";

import { CREATE_FOLDER, LIST_FOLDERS, UPDATE_FOLDER } from "~/graphql/folders.gql";

import {
    CreateFolderResponse,
    CreateFolderVariables,
    FolderItem,
    ListFoldersQueryVariables,
    ListFoldersResponse,
    UpdateFolderResponse,
    UpdateFolderVariables
} from "~/types";

export interface FoldersContext {
    loading: boolean;
    setFolders: Function;
    folders: {
        [type: string]: FolderItem[];
    };
    listFolders: (type: string, useNetwork?: boolean) => Promise<FolderItem[] | Error>;
    createFolder: (data: Partial<FolderItem>) => Promise<FolderItem | Error>;
    updateFolder: (id: string, data: Partial<FolderItem>) => Promise<FolderItem | Error>;
}

export const FoldersContext = React.createContext<FoldersContext | undefined>(undefined);

export const FoldersProvider: React.FC = props => {
    const client = useApolloClient();

    const [folders, setFolders] = useState({});
    const [listLoading, setListLoading] = useState<boolean>(false);

    const [create, { loading: createLoading }] = useMutation<
        CreateFolderResponse,
        CreateFolderVariables
    >(CREATE_FOLDER);

    const [update, { loading: updateLoading }] = useMutation<
        UpdateFolderResponse,
        UpdateFolderVariables
    >(UPDATE_FOLDER);

    const listFolders = async (
        type: string,
        useNetwork?: boolean
    ): Promise<FolderItem[] | Error> => {
        if (!type) {
            throw new Error("Folder `type` is mandatory");
        }

        const { data, loading: queryLoading } = await client.query<
            ListFoldersResponse,
            ListFoldersQueryVariables
        >({
            query: LIST_FOLDERS,
            variables: { type },
            fetchPolicy: useNetwork ? "network-only" : undefined
        });

        setListLoading(queryLoading);
        return get(data, "folders.listFolders");
    };

    const createFolder = async (data: Partial<FolderItem>): Promise<FolderItem | Error> => {
        const response = await create({
            variables: { data }
        });

        return get(response, "data.folders.createFolder");
    };

    const updateFolder = async (
        id: string,
        data: Partial<FolderItem>
    ): Promise<FolderItem | Error> => {
        const response = await update({
            variables: { id, data }
        });

        return get(response, "data.folders.updateFolder");
    };

    const loading = [listLoading, updateLoading, createLoading].some(isLoading => isLoading);

    const value = useMemo(() => {
        return {
            loading,
            folders,
            setFolders,
            listFolders,
            createFolder,
            updateFolder
        };
    }, [loading, folders]);

    return <FoldersContext.Provider value={value}>{props.children}</FoldersContext.Provider>;
};
