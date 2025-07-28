import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetRedirectGraphQLFields } from "~/features/redirects/index.js";
import { ListRedirectsGqlGateway } from "~/features/redirects/loadRedirects/ListRedirectsGqlGateway.js";
import { SearchRedirects } from "~/features/redirects/loadRedirects/SearchRedirects.js";
import { useGetDescendantFolders } from "@webiny/app-aco";

export const useSearchRedirects = () => {
    const client = useApolloClient();
    const fields = useGetRedirectGraphQLFields();
    const gateway = new ListRedirectsGqlGateway(client, fields);
    const { getDescendantFolders } = useGetDescendantFolders();

    const searchRedirects = useCallback(
        (query: string, folderId: string) => {
            const instance = SearchRedirects.getInstance(gateway);
            const folders = getDescendantFolders(folderId);
            return instance.execute({
                query,
                folderIds: folders.map(f => f.id)
            });
        },
        [gateway]
    );

    return {
        searchRedirects
    };
};
