import { useApolloClient } from "@apollo/client/react";
import { ListRedirectsGqlGateway } from "~/features/redirects/loadRedirects/ListRedirectsGqlGateway.js";
import { useGetRedirectGraphQLFields } from "~/features/redirects/index.js";
import { SortRedirects } from "~/features/redirects/loadRedirects/SortRedirects.js";
import type { OnDataTableSortingChange } from "@webiny/admin-ui";
import type { ColumnSorting } from "@webiny/app-utils";
import { SortingMapper } from "@webiny/app-utils";

export const useSortRedirects = () => {
    const client = useApolloClient();
    const fields = useGetRedirectGraphQLFields();
    const gateway = new ListRedirectsGqlGateway(client, fields);

    const sortRedirects: OnDataTableSortingChange = async updaterOrValue => {
        let newSorts: ColumnSorting[] = [];

        if (typeof updaterOrValue === "function") {
            newSorts = updaterOrValue(newSorts || []);
        }

        const params = {
            sorts: newSorts.map(sort => SortingMapper.fromColumnToDTO(sort))
        };

        const instance = SortRedirects.getInstance(gateway);
        return instance.execute(params);
    };

    return {
        sortRedirects
    };
};
