import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { processing, getCommandName } from "./processing.js";
export { createDynamoStreamEvent, createDynamoStreamRecord } from "./processing.js";

type StreamHandler = (event: Record<string, unknown>) => Promise<void>;

export const simulateStream = (documentClient: DynamoDBDocument, handler: StreamHandler) => {
    const originalSend = documentClient["send"];
    documentClient.send = async (...params: any[]) => {
        const [command] = params;

        const name = getCommandName(command);
        if (name) {
            if (!processing[name]) {
                throw new Error(`Missing handler for "${name}" command.`);
            }
            try {
                await processing[name](documentClient, handler, command);
            } catch (ex: any) {
                console.log(JSON.stringify(command));
                throw new Error(`Error processing "${name}" command: ${ex.message}`, ex);
            }
        }

        return await originalSend.apply(documentClient, params as any);
    };
};
