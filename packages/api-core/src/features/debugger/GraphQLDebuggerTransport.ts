import { createImplementation } from "@webiny/feature/api";
import {
    DebuggerTransport as DebuggerTransportAbstraction,
    type IDebugDeliveryTarget,
    type IDebuggerTransportDeliverParams
} from "./abstractions.js";

export const GRAPHQL_TARGET = "graphql";

export interface IGraphQLDeliveryTarget extends IDebugDeliveryTarget {
    type: typeof GRAPHQL_TARGET;
    /**
     * Already resolved to a single result object - never the array. Batched requests are reduced to
     * their last element by the flush plugin, so this transport never has to know about batching.
     */
    result: Record<string, any>;
    requestId: string;
    operations: string[];
    url: string;
}

const isGraphQLTarget = (target: IDebugDeliveryTarget): target is IGraphQLDeliveryTarget => {
    return target.type === GRAPHQL_TARGET;
};

/**
 * Writes a finished session into the GraphQL response's `extensions` property.
 */
export class GraphQLDebuggerTransportImpl implements DebuggerTransportAbstraction.Interface {
    public canDeliver(target: IDebugDeliveryTarget): boolean {
        return isGraphQLTarget(target);
    }

    public deliver({ target, session }: IDebuggerTransportDeliverParams): void {
        if (!isGraphQLTarget(target)) {
            return;
        }

        /**
         * Nothing matched the filter on this request. Writing an envelope with an empty `entries`
         * array would put a payload on every response for no benefit, and give whoever reads the
         * report a pile of blanks to scroll past.
         */
        if (session.entries.length === 0) {
            return;
        }

        const entries = session.entries.map(entry => {
            return {
                seq: entry.seq,
                namespace: entry.namespace,
                timestamp: entry.timestamp,
                elapsed: entry.elapsed,
                /**
                 * Entries are buffered as strings so the payload graph can be released at capture
                 * time. Parsing here is what puts structured data in the response rather than JSON
                 * inside JSON.
                 */
                data: JSON.parse(entry.json)
            };
        });

        writeExtension(target.result, {
            enabled: true,
            requestId: target.requestId,
            url: target.url,
            namespaces: session.namespaces,
            operations: target.operations,
            entries,
            bytes: session.bytes,
            dropped: session.dropped,
            truncated: session.truncated
        });
    }
}

/**
 * Merges a value under `extensions.debug`, never assigning `extensions` wholesale - other plugins
 * write to it too.
 */
export const writeExtension = (result: Record<string, any>, debug: Record<string, any>): void => {
    result.extensions = { ...result.extensions, debug };
};

export const GraphQLDebuggerTransport = createImplementation({
    abstraction: DebuggerTransportAbstraction,
    implementation: GraphQLDebuggerTransportImpl,
    dependencies: []
});
