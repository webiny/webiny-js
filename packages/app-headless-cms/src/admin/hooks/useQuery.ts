import { useQuery as apolloUseQuery } from "@apollo/react-hooks";
import useCms from "./useCms";
import { DocumentNode } from "graphql";
import { OperationVariables, QueryResult } from "@apollo/react-common";
import { QueryHookOptions } from "@apollo/react-hooks/lib/types";

const useQuery = function <TData = any, TVariables = OperationVariables>(
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
