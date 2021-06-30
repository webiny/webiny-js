import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloDynamicLink } from "@webiny/app/plugins/ApolloDynamicLink";
import { plugins } from "@webiny/plugins";
import { ApolloCacheObjectIdPlugin } from "@webiny/app/plugins/ApolloCacheObjectIdPlugin";

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

    // @ts-ignore
    cache.restore("__APOLLO_STATE__" in window ? window.__APOLLO_STATE__ : {});

    const uri = process.env.REACT_APP_GRAPHQL_API_URL;
    const link = ApolloLink.from([new ApolloDynamicLink(), new BatchHttpLink({ uri })]);

    // @ts-ignore
    window.getApolloState = () => {
        // @ts-ignore
        return cache.data.data;
    };

    return new ApolloClient({ link, cache });
};
