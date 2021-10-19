import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { plugins } from "@webiny/plugins";
import { ApolloDynamicLink } from "@webiny/app/plugins/ApolloDynamicLink";
import { ApolloCacheObjectIdPlugin } from "@webiny/app/plugins/ApolloCacheObjectIdPlugin";

// Creates a new Apollo client, pointed to the specified URI.
// Note the `ApolloDynamicLink` plugin. This is what gives us the ability to register
// new `ApolloLinkPlugin` plugins, that can modify different properties within each HTTP request
// Check out the `plugins/apolloLinks.ts` file to see what `ApolloLinkPlugin` we're registering.

export const createApolloClient = ({ uri }) => {
    return new ApolloClient({
        link: ApolloLink.from([
            // This will process `ApolloLinkPlugin` plugins on each HTTP request.
            new ApolloDynamicLink(),

            // This batches HTTP requests made to our GraphQL API (packs multiple requests into a single one).
            new BatchHttpLink({ uri })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => {
                // Since every data type received from our GraphQL API can have a different
                // data model, we cannot rely on just using the `id` field as the cache key.
                // If you'll need custom cache key handling, you can simply register a new
                // `ApolloCacheObjectIdPlugin` plugin in your `plugins/apollo.ts` file.
                const getters = plugins.byType<ApolloCacheObjectIdPlugin>(
                    ApolloCacheObjectIdPlugin.type
                );

                for (let i = 0; i < getters.length; i++) {
                    const id = getters[i].getObjectId(obj);
                    if (typeof id !== "undefined") {
                        return id;
                    }
                }

                // As a fallback, try getting object's `id` property.
                return obj.id || null;
            }
        })
    });
};
