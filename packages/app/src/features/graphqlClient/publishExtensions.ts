import type { EventPublisher } from "~/features/eventPublisher/index.js";
import { GraphQLExtensionsEvent } from "./GraphQLExtensionsEvent.js";

export interface PublishExtensionsParams {
    endpoint: string;
    operationName?: string;
    extensions: Record<string, any> | undefined;
}

/**
 * Announces a response's `extensions`, if it carried any, so ordinary traffic pays nothing.
 *
 * Failing to announce them must not fail the request that produced them: an observer's problem is
 * not the caller's problem.
 */
export const publishExtensions = async (
    eventPublisher: EventPublisher.Interface,
    params: PublishExtensionsParams
): Promise<void> => {
    const { endpoint, operationName, extensions } = params;
    if (!extensions || typeof extensions !== "object") {
        return;
    }

    try {
        const event = new GraphQLExtensionsEvent({ endpoint, operationName, extensions });
        await eventPublisher.publish(event);
    } catch {
        // Nothing to do; the response itself is still good.
    }
};
