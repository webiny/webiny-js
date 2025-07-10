import { decorateDocumentClient } from "@webiny/aws-sdk/client-dynamodb/getDocumentClient";
import type { IHandler } from "~/sync/types.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import {
    BatchWriteCommand,
    DeleteCommand,
    PutCommand,
    UpdateCommand
} from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface IAttachToDynamoDbDocumentParams {
    handler: IHandler;
}

export interface IDecorateClientWithHandlerParams {
    handler: IHandler;
    client: DynamoDBDocument;
}

export const decorateClientWithHandler = (
    params: IDecorateClientWithHandlerParams
): DynamoDBDocument => {
    const { handler, client } = params;
    /**
     * Is there a possibility that this is already attached?
     * Let's check for the handler and then skip attaching.
     */
    // @ts-expect-error
    if (client.__webinyHandler?.id === handler.id) {
        return client;
    }

    const originalSend = client.send;
    const originalPut = client.put;
    const originalDelete = client.delete;
    const originalUpdate = client.update;
    const originalBatchWrite = client.batchWrite;

    // @ts-expect-error
    client.__webinyHandler = handler;

    client.send = async params => {
        // @ts-expect-error
        handler.add(params);
        // @ts-expect-error
        return originalSend.apply(client, [params]);
    };
    // @ts-expect-error
    client.put = async params => {
        const cmd = new PutCommand(params);
        handler.add(cmd);
        // @ts-expect-error
        return originalPut.apply(client, [params]);
    };

    // @ts-expect-error
    client.delete = async params => {
        const cmd = new DeleteCommand(params);
        handler.add(cmd);
        // @ts-expect-error
        return originalDelete.apply(client, [params]);
    };

    // @ts-expect-error
    client.batchWrite = async params => {
        const cmd = new BatchWriteCommand(params);
        handler.add(cmd);
        // @ts-expect-error
        return originalBatchWrite.apply(client, [params]);
    };

    client.update = async params => {
        const cmd = new UpdateCommand(params);
        handler.add(cmd);
        return originalUpdate(params);
    };

    return client;
};

export const attachToDynamoDbDocument = ({ handler }: IAttachToDynamoDbDocumentParams): void => {
    return decorateDocumentClient(client => {
        return decorateClientWithHandler({
            handler,
            client
        });
    });
};
