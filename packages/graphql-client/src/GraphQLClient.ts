import fetch from "cross-fetch";
import Error from "@webiny/error";
import { GraphQLClientCache } from "./types";
import { DocumentNode } from "graphql/language/ast";
import { print } from "graphql/language/printer";
import addTypenameToDocument from "./GraphQLClient/addTypenameToDocument";

export type RequestObject = {
    url: string;
    method: "POST";
    headers: Record<string, any>;
    body: string;
};

export type RequestInterceptorFunction = (requestObject: RequestObject) => void | Promise<void>;

export type GraphQLClientConfiguration = {
    url: string;
    batch?: boolean;
    headers?: (Record<string, any> | (() => Record<string, any>))[];
    cache?: GraphQLClientCache;
    requestInterceptors?: RequestInterceptorFunction[];
};

export type QueryArgs<TVariables = Record<string, any>> = {
    configuration?: string;
    query: DocumentNode;
    variables?: TVariables;
};

export type MutationArgs<TVariables = Record<string, any>> = {
    configuration?: string;
    query: DocumentNode;
    variables?: TVariables;
};

export default class GraphQLClient {
    configuration: GraphQLClientConfiguration;
    constructor(configuration: GraphQLClientConfiguration) {
        this.configuration = configuration;
    }

    async query<TResult = Record<string, any>, TVariables = Record<string, any>>(
        args: QueryArgs<TVariables>
    ): Promise<TResult> {
        const configuration = this.configuration;

        const { query, variables } = args;

        const queryWithTypes = addTypenameToDocument(query);

        const { cache } = configuration;
        if (cache) {
            const data = await cache.readQuery<TResult>({ query: queryWithTypes, variables });
            if (data) {
                return data;
            }
        }

        const result = await this.executeRequest(configuration, {
            query: queryWithTypes,
            variables
        });

        if (result && cache) {
            await cache.writeQuery({ query: queryWithTypes, variables, result });
        }

        return result;
    }

    async mutate<TResult = Record<string, any>, TVariables = Record<string, any>>(
        args: MutationArgs<TVariables>
    ): Promise<TResult> {
        const configuration = this.configuration;

        const { query, variables } = args;
        const { cache } = configuration;

        const result = await this.executeRequest(configuration, args);
        if (result && cache) {
            await cache.writeQuery({ query, variables, result });
        }

        return result;
    }

    getCache() {
        return this.configuration.cache;
    }

    async executeRequest(
        configuration: GraphQLClientConfiguration,
        args: QueryArgs | MutationArgs
    ) {
        const { requestInterceptors } = configuration;
        const { query, variables } = args;

        const request: RequestObject = {
            url: configuration.url,
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                query: print(query),
                variables
            })
        };

        if (Array.isArray(requestInterceptors)) {
            for (let i = 0; i < requestInterceptors.length; i++) {
                const interceptor = requestInterceptors[i];
                await interceptor(request);
            }
        }

        const { url, ...options } = request;
        const response = await fetch(url, options);
        if (response.status >= 400) {
            throw new Error(`Bad response from server (response code: ${response.status}).`);
        }

        const { data, errors } = await response.json();
        if (errors) {
            throw new Error("An error occurred while trying to execute GQL query.", errors);
        }

        return data;
    }
}
