// @flow
import _ from "lodash";
import ApolloClient, { type ApolloClientOptions } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { setContext } from "apollo-link-context";
import { InMemoryCache } from "apollo-cache-inmemory";

function createApolloClient() {
    const { uri, ...config } = this.config;

    config.link = ApolloLink.from([
        setContext((req, context) => {
            const newContext = { ...context };
            this.interceptors.map(cb => {
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
        this.config = {};
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

    addRequestInterceptor(cb: Function) {
        this.interceptors.push(cb);
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
