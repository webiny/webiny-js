import {
    createDynamoDbLogger,
    createStorageOperations,
    DynamoDbLoggerKeys
} from "./dynamodb/index.js";
import { create } from "~/db/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface ILoggerFactoryParams {
    documentClient: DynamoDBDocument;
    getTenant: () => string;
}

export const loggerFactory = ({ getTenant, getLocale, documentClient }: ILoggerFactoryParams) => {
    const keys = new DynamoDbLoggerKeys();
    const { entity } = create({
        documentClient
    });

    const storageOperations = createStorageOperations({
        entity,
        keys
    });

    return {
        logger: createDynamoDbLogger({
            onFlush: async items => {
                try {
                    return await storageOperations.insert({
                        items
                    });
                } catch (ex) {
                    console.error("Error flushing logs.");
                    console.log(ex);
                }
                return [];
            },
            getTenant
        }),
        storageOperations
    };
};
