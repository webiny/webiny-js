import { useLazyQuery as apolloUseLazyQuery } from "@apollo/react-hooks";
import useCms from "./useCms";
import { DocumentNode } from "graphql";
import { OperationVariables } from "@apollo/react-common";
import { LazyQueryHookOptions, QueryTuple } from "@apollo/react-hooks/lib/types";

const useLazyQuery = function <TData = any, TVariables = OperationVariables>(
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
