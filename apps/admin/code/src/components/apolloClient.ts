import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import {
    createOmitTypenameLink,
    createSetContextLink,
    createConsoleLink
} from "@webiny/app/graphql";
import { plugins } from "@webiny/plugins";
import { CacheGetObjectIdPlugin } from "@webiny/app/types";

export const createApolloClient = ({ uri }) => {
    return new ApolloClient({
        link: ApolloLink.from([
            /**
             * This link checks for `extensions.console` in the response, and logs it to browser console.
             */
            createConsoleLink(),
            /**
             * This link removes `__typename` from the variables being sent to the API.
             */
            createOmitTypenameLink(),
            /**
             * This allows you to register links using plugins.
             */
            ...plugins.byType("apollo-link").map(pl => pl.createLink()),
            /**
             * This allows you to modify request context using "apollo-link-context" plugin.
             */
            createSetContextLink(),
            /**
             * This batches requests made to the API to pack multiple requests into a single HTTP request.
             */
            new BatchHttpLink({ uri })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => {
                /**
                 * Since every data type coming from API can have a different data structure,
                 * we cannot rely on having an `id` field.
                 */
                const getters = plugins.byType<CacheGetObjectIdPlugin>("cache-get-object-id");
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
        })
    });
};
