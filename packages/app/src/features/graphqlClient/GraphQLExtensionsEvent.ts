import { BaseEvent } from "~/features/eventPublisher/index.js";
import { GraphQLExtensionsEventHandler } from "./abstractions.js";

export interface GraphQLExtensionsPayload {
    endpoint: string;
    operationName?: string;
    extensions: Record<string, any>;
}

/**
 * Published when a GraphQL response carries `extensions`.
 *
 * `execute` returns only `data`, so extensions would otherwise be unreachable to anything outside
 * this client - a decorator sees the return value, which is already past them. Publishing keeps that
 * contract intact while letting an interested feature observe them, without this package needing to
 * know who is listening.
 */
export class GraphQLExtensionsEvent extends BaseEvent<GraphQLExtensionsPayload> {
    eventType = "graphql.extensions" as const;

    getHandlerAbstraction() {
        return GraphQLExtensionsEventHandler;
    }
}
