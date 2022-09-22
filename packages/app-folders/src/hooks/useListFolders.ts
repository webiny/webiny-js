import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";

import { LIST_FOLDERS } from "~/graphql/folders.gql";

import { FolderItem, ListFoldersQueryVariables, ListFoldersResponse } from "~/types";

interface UseListFolders {
    folders: FolderItem[];
    loading: boolean;
}

export const useListFolders = (type: string): UseListFolders => {
    const { data, loading } = useQuery<ListFoldersResponse, ListFoldersQueryVariables>(
        LIST_FOLDERS,
        {
            variables: {
                type
            }
        }
    );

    return {
        loading,
        folders: loading ? [] : get(data, "folders.listFolders.data")
    };
};
