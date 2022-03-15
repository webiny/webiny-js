import useCms from "./useCms";
import { useMutation as apolloUseMutation } from "@apollo/react-hooks";
import { DocumentNode } from "graphql";
import { OperationVariables } from "@apollo/react-common";
import { MutationHookOptions, MutationTuple } from "@apollo/react-hooks/lib/types";

const useMutation = function <TData = any, TVariables = OperationVariables>(
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
