import useCms from "./useCms.js";
import { useMutation as apolloUseMutation } from "@apollo/client/react";
import type { DocumentNode } from "graphql";
import type { OperationVariables } from "@apollo/client";

export const useMutation = function <
    TData = any,
    TVariables extends OperationVariables = OperationVariables
>(
    mutation: DocumentNode,
    options: apolloUseMutation.Options<TData, TVariables> = {}
): apolloUseMutation.ResultTuple<TData, TVariables> {
    const { apolloClient } = useCms();

    return apolloUseMutation<TData, TVariables>(mutation, {
        client: apolloClient,
        ...options
    });
};

export default useMutation;
