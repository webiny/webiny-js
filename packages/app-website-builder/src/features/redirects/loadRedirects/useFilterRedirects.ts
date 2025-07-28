import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetRedirectGraphQLFields } from "~/features/redirects/index.js";
import { ListRedirectsGqlGateway } from "~/features/redirects/loadRedirects/ListRedirectsGqlGateway.js";
import { FilterRedirects } from "~/features/redirects/loadRedirects/FilterRedirects.js";
import { useGetDescendantFolders } from "@webiny/app-aco";

export const useFilterRedirects = () => {
    const client = useApolloClient();
    const fields = useGetRedirectGraphQLFields();
    const gateway = new ListRedirectsGqlGateway(client, fields);
    const { getDescendantFolders } = useGetDescendantFolders();

    const filterRedirects = useCallback(
        (filters: Record<string, any>, folderId: string) => {
            const instance = FilterRedirects.getInstance(gateway);
            const folders = getDescendantFolders(folderId);
            return instance.execute({
                filters,
                folderIds: folders.map(f => f.id)
            });
        },
        [gateway]
    );

    return {
        filterRedirects
    };
};
