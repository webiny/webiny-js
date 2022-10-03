import React, { useState, useMemo } from "react";
import { useApolloClient, useMutation } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";
import get from "lodash/get";

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

const t = i18n.ns("app-folders/hooks/use-create-folder");

export interface FoldersContext {
    loading: boolean;
    folders: {
        [type: string]: FolderItem[];
    };
    listFolders: Function;
    createFolder: Function;
    updateFolder: Function;
}

export const FoldersContext = React.createContext<FoldersContext | undefined>(undefined);

export const FoldersProvider: React.FC = props => {
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const [folders, setFolders] = useState({});
    const [listLoading, setListLoading] = useState<boolean>(false);

    const listFolders = async (type: string) => {
        if (!type) {
            throw new Error("Folder `type` is mandatory");
        }

        const { data, loading: queryLoading } = await client.query<
            ListFoldersResponse,
            ListFoldersQueryVariables
        >({
            query: LIST_FOLDERS,
            variables: { type },
            fetchPolicy: "network-only"
        });

        setListLoading(queryLoading);
        setFolders({
            ...folders,
            [type]: get(data, "folders.listFolders.data", [])
        });
    };

    const [createFolder, { loading: createLoading }] = useMutation<
        CreateFolderResponse,
        CreateFolderVariables
    >(CREATE_FOLDER, {
        onCompleted: response => {
            const error = get(response, "folders.createFolder.error");
            if (error) {
                return showSnackbar(error.message);
            }
            showSnackbar(t("Folder created successfully!"));
        }
    });

    const [updateFolder, { loading: updateLoading }] = useMutation<
        UpdateFolderResponse,
        UpdateFolderVariables
    >(UPDATE_FOLDER, {
        onCompleted: response => {
            const error = get(response, "folders.updateFolder.error");
            if (error) {
                return showSnackbar(error.message);
            }
            showSnackbar(t("Folder updated successfully!"));
        }
    });

    const loading = [listLoading, updateLoading, createLoading].some(isLoading => isLoading);

    const value = useMemo(() => {
        return {
            loading,
            folders,
            listFolders,
            createFolder,
            updateFolder
        };
    }, [loading, folders]);

    return <FoldersContext.Provider value={value}>{props.children}</FoldersContext.Provider>;
};
