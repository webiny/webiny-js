import { useQuery as apolloUseQuery } from "@apollo/client/react";
import useCms from "./useCms.js";
import type { DocumentNode } from "graphql";
import type { OperationVariables } from "@apollo/client";

export const useQuery = function <
    TData = any,
    TVariables extends OperationVariables = OperationVariables
>(
    query: DocumentNode,
    options?: apolloUseQuery.Options<TData, TVariables>
): apolloUseQuery.Result<TData, TVariables> {
    const { apolloClient } = useCms();

    return apolloUseQuery<TData, TVariables>(query, {
        client: apolloClient,
        skip: !apolloClient,
        ...options,
        variables: options?.variables as TVariables
    });
};

export default useQuery;
