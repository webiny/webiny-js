import useCms from "./useCms";
import { useQuery as apolloUseQuery } from "@apollo/react-hooks";
import { DocumentNode } from "graphql";
import { OperationVariables, QueryResult } from "@apollo/react-common";
import { QueryHookOptions } from "@apollo/react-hooks/lib/types";

export const useQueryLocale = function <TData = any, TVariables = OperationVariables>(
    query: DocumentNode,
    locale: string,
    options: QueryHookOptions<TData, TVariables> = {}
): QueryResult<TData, TVariables> {
    const { getApolloClient } = useCms();
    const client = getApolloClient(locale);

    return apolloUseQuery<TData, TVariables>(query, {
        client,
        skip: !client,
        ...options
    });
};
