import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { ListPagesGqlGateway } from "~/features/pages/listPages/ListPagesGqlGateway.js";
import { useGetPageGraphQLSelection } from "~/features/pages/index.js";
import { SearchPages } from "~/features/pages/listPages/SearchPages.js";
import { useGetDescendantFolders } from "@webiny/app-aco";

export const useSearchPages = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLSelection();
    const gateway = new ListPagesGqlGateway(client, fields);
    const { getDescendantFolders } = useGetDescendantFolders();

    const searchPages = useCallback(
        (query: string, folderId: string) => {
            const instance = SearchPages.getInstance(gateway);
            const folders = getDescendantFolders(folderId);
            return instance.useCase.execute(
                query,
                folders.map(f => f.id)
            );
        },
        [gateway]
    );

    return {
        searchPages
    };
};
