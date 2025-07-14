import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { ListPagesGqlGateway } from "~/features/pages/loadPages/ListPagesGqlGateway.js";
import { FilterPages } from "~/features/pages/loadPages/FilterPages.js";
import { useGetDescendantFolders } from "@webiny/app-aco";

export const useFilterPages = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(["properties", "metadata"]);
    const gateway = new ListPagesGqlGateway(client, fields);
    const { getDescendantFolders } = useGetDescendantFolders();

    const filterPages = useCallback(
        (filters: Record<string, any>, folderId: string) => {
            const instance = FilterPages.getInstance(gateway);
            const folders = getDescendantFolders(folderId);
            return instance.execute({
                filters,
                folderIds: folders.map(f => f.id)
            });
        },
        [gateway]
    );

    return {
        filterPages
    };
};
