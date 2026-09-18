import { ApolloLink } from "apollo-link";
import type { NextLink, Operation } from "apollo-link";
import type { DebuggerStore, IDebugPayload } from "./DebuggerStore.js";

export const DEBUG_HEADER = "x-webiny-debug";

/**
 * Attaches the debug header when capture is on, and collects whatever comes back.
 *
 * The toggle is read inside `request` rather than when the link is created: `ApolloDynamicLink`
 * caches composed links, so a link built once with "off" baked in would never notice the toggle
 * being flipped.
 */
export const createDebuggerLink = (store: DebuggerStore): ApolloLink => {
    return new ApolloLink((operation: Operation, forward: NextLink) => {
        if (store.enabled) {
            operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => {
                return {
                    headers: {
                        ...headers,
                        [DEBUG_HEADER]: store.namespaces || "*"
                    }
                };
            });
        }

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
