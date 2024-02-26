import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "@webiny/app/apollo-client/InMemoryCache";
import { ApolloDynamicLink } from "@webiny/app/plugins/ApolloDynamicLink";
import { plugins } from "@webiny/plugins";
import { ApolloCacheObjectIdPlugin } from "@webiny/app/plugins/ApolloCacheObjectIdPlugin";

declare global {
    interface Window {
        getApolloState: () => Record<string, any>;
    }
}

export const createApolloClient = () => {
    const cache = new InMemoryCache({
        addTypename: true,
        dataIdFromObject: obj => {
            /**
             * Since every data type coming from API can have a different data structure,
             * we cannot rely on having an `id` field.
             */
            const getters = plugins.byType<ApolloCacheObjectIdPlugin>(
                ApolloCacheObjectIdPlugin.type
            );

            for (let i = 0; i < getters.length; i++) {
                const id = getters[i].getObjectId(obj);
                if (typeof id !== "undefined") {
                    return id;
                }
            }

            /**
             * As a fallback, try getting object's `id`.
             */
            return obj.id || null;
        }
    });

    // @ts-expect-error
    cache.restore("__APOLLO_STATE__" in window ? window.__APOLLO_STATE__ : {});

    const uri = process.env.REACT_APP_GRAPHQL_API_URL;
    const link = ApolloLink.from([new ApolloDynamicLink(), new BatchHttpLink({ uri })]);

    window.getApolloState = () => {
        // @ts-expect-error `cache.data` is marked as private in the `apollo-cache-inmemory` package.
        return cache?.data?.data;
    };

    return new ApolloClient({ link, cache });
};
