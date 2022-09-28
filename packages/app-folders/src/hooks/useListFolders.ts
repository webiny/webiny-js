import { useMemo, useState } from "react";
import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";

import { useFolders } from "~/hooks/useFolders";
import { LIST_FOLDERS } from "~/graphql/folders.gql";

import { FolderItem, ListFoldersQueryVariables, ListFoldersResponse } from "~/types";

interface UseListFolders {
    loading: boolean;
    folders: FolderItem[];
    refetchFolders: Function;
}

export const useListFolders = (): UseListFolders => {
    const { folderType } = useFolders();
    const [loading, setLoading] = useState<boolean>(false);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [refetchFolders, setRefetchFolders] = useState<Function>(async () => {
        return null;
    });

    const {
        data,
        loading: queryLoading,
        refetch
    } = useQuery<ListFoldersResponse, ListFoldersQueryVariables>(LIST_FOLDERS, {
        skip: !folderType,
        variables: {
            type: folderType as string
        }
    });

    useMemo(() => {
        setLoading(queryLoading);
    }, [queryLoading]);

    useMemo(() => {
        const folders = queryLoading ? [] : get(data, "folders.listFolders.data", []);
        setFolders(folders);
    }, [data, queryLoading]);

    useMemo(() => {
        setRefetchFolders(() => refetch);
    }, [refetch]);

    return {
        loading,
        folders,
        refetchFolders
    };
};
