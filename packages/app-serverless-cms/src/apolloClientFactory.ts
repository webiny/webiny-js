import ApolloClient from "apollo-client";
import { IntrospectionFragmentMatcher } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "@webiny/app/apollo-client/InMemoryCache";
import { plugins } from "@webiny/plugins";
import { ApolloDynamicLink } from "@webiny/app/plugins/ApolloDynamicLink";
import { ApolloCacheObjectIdPlugin } from "@webiny/app/plugins/ApolloCacheObjectIdPlugin";

declare global {
    interface Window {
        getCmsApolloState: () => Record<string, any>;
    }
}
interface CreateApolloClientParams {
    uri: string;
}
export const createApolloClient = ({ uri }: CreateApolloClientParams) => {
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
        },
        fragmentMatcher: new IntrospectionFragmentMatcher({
            introspectionQueryResultData: {
                __schema: {
                    types: [
                        {
                            kind: "UNION",
                            name: "Blog2_Zone",
                            possibleTypes: [
                                {
                                    name: "Blog2_Zone_Template1"
                                },
                                {
                                    name: "Blog2_Zone_Template2"
                                }
                            ]
                        }
                    ]
                }
            }
        })
    });

    // @ts-ignore
    cache.restore("__APOLLO_STATE__" in window ? window.__APOLLO_STATE__.cms : {});

    window.getCmsApolloState = () => {
        // @ts-ignore `cache.data` is marked as private in the `apollo-cache-inmemory` package.
        return cache?.data?.data;
    };

    return new ApolloClient({
        link: ApolloLink.from([
            /**
             * This will process links from plugins on every request.
             */
            new ApolloDynamicLink(),
            /**
             * This batches requests made to the API to pack multiple requests into a single HTTP request.
             */
            new BatchHttpLink({ uri })
        ]),
        cache
    });
};
