import { Container } from "@webiny/feature/api";
import { RequestContainer } from "@webiny/event-handler-core";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { OpenSearchClientFeature } from "@webiny/api-opensearch/features/OpenSearchClient/feature.js";
import { DdbToEsLambdaHandler } from "./DdbToEsLambdaHandler.js";
import { DynamoDBEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/DynamoDBEventHandler.js";
import type { Client } from "@webiny/api-opensearch/client.js";
import type { DynamoDBStreamEvent } from "@webiny/aws-sdk/types/index.js";

export type DdbToEsStreamHandler = (event: DynamoDBStreamEvent) => Promise<void>;

export const createDdbToEsStreamHandler = (client: Client): DdbToEsStreamHandler => {
    const container = new Container();
    container.registerInstance(RequestContainer, container);
    CompressionFeature.register(container);
    OpenSearchClientFeature.register(container, client);
    container.register(DdbToEsLambdaHandler);
    const handler = container.resolve(DynamoDBEventHandler);

    return async (event: DynamoDBStreamEvent): Promise<void> => {
        await handler.execute({ event, metadata: {} }, () => Promise.resolve());
    };
};
