import {useLazyQuery as apolloUseLazyQuery} from "@apollo/client/react";
import useCms from "./useCms.js";
import type {DocumentNode} from "graphql";
import type {OperationVariables} from "@apollo/client";

export const useLazyQuery = function <TData = any, TVariables extends OperationVariables = OperationVariables>(
    query: DocumentNode,
    options: apolloUseLazyQuery.Options<TData, TVariables> = {}
): apolloUseLazyQuery.ResultTuple<TData, TVariables> {
    const { apolloClient } = useCms();
    
    return apolloUseLazyQuery<TData, TVariables>(query, {
        client: apolloClient,
        ...options
    });
};

export default useLazyQuery;
