import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { useMemo } from "react";
import { GetPageGqlGateway } from "./GetPageGqlGateway.js";
import { GetPage, type IGetPageInstance } from "./GetPage.js";
import { useContainer } from "@webiny/app";
import { GetPageGraphQLFieldSelection } from "./abstractions.js";

export const useGetPageGatewayInstance = (inputFields: string[]): IGetPageInstance => {
    const container = useContainer();

    const resolvedFieldSelection = container.resolveAll(GetPageGraphQLFieldSelection);

    const resolvedFields = [...inputFields];
    for (const selection of resolvedFieldSelection) {
        resolvedFields.push(...selection.getSelection());
    }

    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(resolvedFields);

    return useMemo(() => {
        const gateway = new GetPageGqlGateway(client, fields);
        return GetPage.getInstance(gateway);
    }, []);
};
