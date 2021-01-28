import React, { useContext, useEffect, useState } from "react";
// @ts-ignore
import { GraphQLClient } from "@webiny/graphql-client";
import { DocumentNode } from "graphql/language/ast";

type GraphQLClientContextValue = { cacheChangedOn: number; client: GraphQLClient };
const GraphQLClientContext = React.createContext<GraphQLClientContextValue>(null);

export type GraphQLClientProviderProps = {
    client: GraphQLClient;
    children: React.ReactNode;
};

export function GraphQLClientProvider(props: GraphQLClientProviderProps) {
    const [value, setValue] = useState<GraphQLClientContextValue>({
        client: props.client,
        cacheChangedOn: 0
    });

    useEffect(() => {
        if (!props.client.getCache()) {
            return;
        }

        props.client.getCache().onChange(() => {
            // Will force all consumer components to rerender.
            setValue({ cacheChangedOn: new Date().getTime(), client: props.client });
        });
    }, []);

    return (
        <GraphQLClientContext.Provider value={value}>
            {props.children}
        </GraphQLClientContext.Provider>
    );
}

export function useGraphQLClient() {
    const context = useContext(GraphQLClientContext);
    if (!context) {
        throw new Error("useGraphQLClient must be used within a GraphQLClientProvider.");
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
    const { client, cacheChangedOn } = useGraphQLClient();
    const [data, setData] = useState<any>();
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
    }, [cacheChangedOn, skip, JSON.stringify(clientArgs.variables)]);

    return { data, loading };
}
