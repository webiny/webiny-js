import useCms from "./useCms.js";
import { useMutation as apolloUseMutation } from "@apollo/react-hooks";
import type { DocumentNode } from "graphql";
import type { OperationVariables } from "@apollo/react-common";
import type { MutationHookOptions, MutationTuple } from "@apollo/react-hooks/lib/types.js";

export const useMutation = function <TData = any, TVariables = OperationVariables>(
    mutation: DocumentNode,
    options: MutationHookOptions<TData, TVariables> = {}
): MutationTuple<TData, TVariables> {
    const { apolloClient } = useCms();

    return apolloUseMutation<TData, TVariables>(mutation, {
        client: apolloClient,
        ...options
    });
};

export default useMutation;
