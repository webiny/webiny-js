import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { ListPagesGqlGateway, ListPagesGraphQLFieldSelection } from "./ListPagesGqlGateway.js";
import { useContainer } from "@webiny/app";
import type { IListPagesGateway } from "./IListPagesGateway.js";

export const useListPagesGateway = (inputFields: string[]): IListPagesGateway => {
    const container = useContainer();
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(inputFields);

    return new ListPagesGqlGateway({
        client,
        modelFields: fields,
        fieldSelection: container.resolveAll(ListPagesGraphQLFieldSelection)
    });
};
