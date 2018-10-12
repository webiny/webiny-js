// @flow
import _ from "lodash";
import ApolloClient, { type ApolloClientOptions, ApolloError } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { setContext } from "apollo-link-context";
import { InMemoryCache } from "apollo-cache-inmemory";
import GraphQLError from "./Error";

type GraphQLQueryParams = {
    query: Object,
    variables?: Object
};

type GraphQLMutateParams = {
    mutation: Object,
    variables?: Object
};

type GraphQLResponse = Promise<Object>;

function createApolloClient() {
    const { uri, ...config } = this.config;

    config.link = ApolloLink.from([
        setContext((req, context) => {
            const newContext = { ...context };
            this.interceptors.forEach(cb => {
                _.merge(newContext, cb(req, newContext));
            });
            return newContext;
        }),
        new HttpLink({ uri })
    ]);

    if (!config.cache) {
        config.cache = new InMemoryCache();
    }

    return new ApolloClient(config);
}

class Client {
    apolloClient: ApolloClient;
    config: Object;
    interceptors: Array<Function>;
    constructor() {
        this.config = {
            errorPolicy: "all"
        };
        this.interceptors = [];
        this.apolloClient = null;

        return new Proxy(this, {
            get: (instance, key) => {
                if (key in instance) {
                    return Reflect.get(instance, key);
                }

                return instance.apolloClient[key];
            }
        });
    }

    query(params: GraphQLQueryParams): GraphQLResponse {
        return this.apolloClient.query(params);
    }

    mutate(params: GraphQLMutateParams): GraphQLResponse {
        return this.apolloClient.mutate(params);
    }

    addRequestInterceptor(cb: Function) {
        this.interceptors.push(cb);
    }

    toError(error: ApolloError) {
        return GraphQLError.from(error);
    }

    /**
     * Set ApolloClient instance.
     * Use when you want to entirely customize how your GraphQL client works.
     * @param client
     */
    setClient(client: ApolloClient) {
        this.apolloClient = client;
    }

    setConfig(config: ApolloClientOptions) {
        this.config = { ...this.config, ...config };
        this.apolloClient = createApolloClient.call(this);
    }
}

export default Client;
