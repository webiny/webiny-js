import { ApolloLink } from "apollo-link";
import type { NextLink, Operation } from "apollo-link";
import type { DebuggerStore, IDebugPayload } from "./DebuggerStore.js";

/**
 * Collects whatever debug data comes back.
 *
 * Deliberately sends no request header. Whether to capture is decided entirely by the API from the
 * identity's permissions, which keeps this off the CORS and CloudFront header whitelists - a header
 * added there is cached in preflight responses for a day, so rolling one out breaks requests
 * intermittently until every cache entry expires.
 */
export const DEBUG_HEADER = "x-webiny-debug";

export const createDebuggerLink = (store: DebuggerStore): ApolloLink => {
    return new ApolloLink((operation: Operation, forward: NextLink) => {
        /**
         * Kept for reference. Sending the header requires it on the CORS allow-list, which is
         * cached in preflight responses at CloudFront and in the browser for a day - so adding it
         * breaks requests intermittently until every cache entry expires. The API decides from the
         * identity's permissions instead, and needs nothing from the client.
         *
         * if (store.enabled) {
         *     operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => {
         *         return {
         *             headers: {
         *                 ...headers,
         *                 [DEBUG_HEADER]: store.namespaces || "*"
         *             }
         *         };
         *     });
         * }
         */
        return forward(operation).map(response => {
            /**
             * Batched requests carry the payload on one arbitrary operation's result, so every
             * response is inspected rather than only the one that was asked for.
             */
            const debug = (response.extensions as { debug?: IDebugPayload } | undefined)?.debug;

            if (debug) {
                store.collect(debug);
            }

            return response;
        });
    });
};
