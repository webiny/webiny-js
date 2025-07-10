import { useApolloClient } from "@apollo/react-hooks";
import { ListPagesGqlGateway } from "~/features/pages/listPages/ListPagesGqlGateway.js";
import { useGetPageGraphQLSelection } from "~/features/pages/index.js";
import { SortPages } from "~/features/pages/listPages/SortPages.js";
import { OnDataTableSortingChange } from "@webiny/admin-ui";
import { ColumnSorting, SortingMapper } from "@webiny/app-utils";

export const useSortPages = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLSelection();
    const gateway = new ListPagesGqlGateway(client, fields);

    const sortPages: OnDataTableSortingChange = async updaterOrValue => {
        let newSorts: ColumnSorting[] = [];

        if (typeof updaterOrValue === "function") {
            newSorts = updaterOrValue(newSorts || []);
        }

        const params = {
            sorts: newSorts.map(sort => SortingMapper.fromColumnToDTO(sort))
        };

        const instance = SortPages.getInstance(gateway);
        return instance.useCase.execute(params);
    };

    return {
        sortPages
    };
};
