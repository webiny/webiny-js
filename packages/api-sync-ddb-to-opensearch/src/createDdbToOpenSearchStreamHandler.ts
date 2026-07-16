import { Container } from "@webiny/feature/api";
import { RequestContainer } from "@webiny/event-handler-core";
import { DynamoDBEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/DynamoDBEventHandler.js";
import { TimerFeature } from "@webiny/utils/features/Timer/feature.js";
import { ProcessEnvFeature } from "@webiny/stdlib/node";
import { DdbToOpenSearchFeature } from "./features/DdbToOpenSearchFeature.js";
import type { Client } from "@webiny/api-opensearch/client.js";
import type { DynamoDBStreamEvent } from "@webiny/aws-sdk/types/index.js";

export type DdbToOpenSearchStreamHandler = (event: DynamoDBStreamEvent) => Promise<void>;

export const createDdbToOpenSearchStreamHandler = (
    client: Client
): DdbToOpenSearchStreamHandler => {
    const container = new Container();
    container.registerInstance(RequestContainer, container);

    // Existing behavior: MAX_RUNNING_TIME = 900 hardcoded.
    // In real Lambda deployments, the handler bootstrap should register a Timer
    // that wraps context.getRemainingTimeInMillis(). This factory matches current behavior.
    ProcessEnvFeature.register(container);
    TimerFeature.register(container, {
        getRemainingSeconds: () => 900,
        getRemainingMilliseconds: () => 900 * 1000
    });

    DdbToOpenSearchFeature.register(container, { client });

    const handler = container.resolve(DynamoDBEventHandler);

    return async (event: DynamoDBStreamEvent): Promise<void> => {
        await handler.execute({ event, metadata: {} }, () => Promise.resolve());
    };
};
