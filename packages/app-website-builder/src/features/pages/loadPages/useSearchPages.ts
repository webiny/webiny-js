import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { ListPagesGqlGateway } from "~/features/pages/loadPages/ListPagesGqlGateway.js";
import { SearchPages } from "~/features/pages/loadPages/SearchPages.js";
import { useGetDescendantFolders } from "@webiny/app-aco";

export const useSearchPages = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(["properties", "metadata"]);
    const gateway = new ListPagesGqlGateway(client, fields);
    const { getDescendantFolders } = useGetDescendantFolders();

    const searchPages = useCallback(
        (query: string, folderId: string) => {
            const instance = SearchPages.getInstance(gateway);
            const folders = getDescendantFolders(folderId);
            return instance.execute({
                query,
                folderIds: folders.map(f => f.id)
            });
        },
        [gateway]
    );

    return {
        searchPages
    };
};
