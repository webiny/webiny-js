import React, { useContext, useEffect, useState } from "react";
import { GraphQLClient } from "@webiny/graphql-client";
import { DocumentNode } from "graphql/language/ast";

const GraphQLClientContext = React.createContext<GraphQLClient>(null);

export type GraphQLClientProviderProps = {
    client: GraphQLClient;
    children: React.ReactNode;
};

export function GraphQLClientProvider(props: GraphQLClientProviderProps) {
    return (
        <GraphQLClientContext.Provider value={props.client}>
            {props.children}
        </GraphQLClientContext.Provider>
    );
}

export function useGraphQLClient() {
    const context = useContext(GraphQLClientContext);
    if (!context) {
        throw new Error("useGraphQLClient must be used within a GraphQLClientProvider");
    }

    return context;
}

export type UseQueryOptions<TResult = Record<string, any>, TVariables = Record<string, any>> = {
    configuration?: string;
    variables?: TVariables;
    skip?: boolean;
    onCompleted?: (result: TResult, client: GraphQLClient) => void;
};

export function useQuery<TResult = Record<string, any>, TVariables = Record<string, any>>(
    query: DocumentNode,
    options: UseQueryOptions<TResult, TVariables> = {}
) {
    const client = useGraphQLClient();
    const [data, setData] = useState();
    const [loading, setLoading] = useState(false);

    const { skip, onCompleted, ...clientArgs } = options;

    useEffect(() => {
        if (skip) {
            return;
        }

        setLoading(true);
        client
            .query<TResult, TVariables>({
                query,
                ...clientArgs
            })
            .then(result => {
                setData(result);
                setLoading(false);
                if (typeof onCompleted === "function") {
                    onCompleted(result, client);
                }
            });

    }, [skip, JSON.stringify(clientArgs.variables)]);

    return { data, loading };
}
