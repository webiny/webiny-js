import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { ListPagesGqlGateway } from "./ListPagesGqlGateway.js";
import { useContainer } from "@webiny/app";
import type { IListPagesGateway } from "./IListPagesGateway.js";
import { ListPagesGraphQLFieldSelection } from "./abstractions.js";

export const useListPagesGateway = (inputFields: string[]): IListPagesGateway => {
    const container = useContainer();
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(inputFields);

    const selections = container.resolveAll(ListPagesGraphQLFieldSelection);

    return new ListPagesGqlGateway({
        client,
        modelFields: fields,
        fieldSelection: selections
    });
};
