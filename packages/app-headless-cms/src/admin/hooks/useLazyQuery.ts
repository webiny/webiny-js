import { useLazyQuery as apolloUseLazyQuery } from "@apollo/react-hooks";
import useCms from "./useCms.js";
import type { DocumentNode } from "graphql";
import type { OperationVariables } from "@apollo/react-common";
import type { LazyQueryHookOptions, QueryTuple } from "@apollo/react-hooks/lib/types.js";

export const useLazyQuery = function <TData = any, TVariables = OperationVariables>(
    query: DocumentNode,
    options: LazyQueryHookOptions<TData, TVariables> = {}
): QueryTuple<TData, TVariables> {
    const { apolloClient } = useCms();

    return apolloUseLazyQuery<TData, TVariables>(query, {
        client: apolloClient,
        ...options
    });
};

export default useLazyQuery;
