import { useQuery as apolloUseQuery } from "@apollo/react-hooks";
import useCms from "./useCms.js";
import type { DocumentNode } from "graphql";
import type { OperationVariables, QueryResult } from "@apollo/react-common";
import type { QueryHookOptions } from "@apollo/react-hooks/lib/types.js";

export const useQuery = function <TData = any, TVariables = OperationVariables>(
    query: DocumentNode,
    options: QueryHookOptions<TData, TVariables> = {}
): QueryResult<TData, TVariables> {
    const { apolloClient } = useCms();

    return apolloUseQuery<TData, TVariables>(query, {
        client: apolloClient,
        skip: !apolloClient,
        ...options
    });
};

export default useQuery;
