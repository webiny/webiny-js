import { DynamoDbLogger } from "~/logger";
import type { ILogger, ILoggerStorageOperations } from "~/types";

export interface ICreateMockLoggerParams {
    tenant?: string;
    storageOperations: ILoggerStorageOperations;
}

export const createMockLogger = (params: ICreateMockLoggerParams): ILogger => {
    return new DynamoDbLogger({
        getTenant: () => {
            return params.tenant || "root";
        },
        options: {
            waitForFlushMs: 500
        },
        onFlush: async items => {
            return await params.storageOperations.insert({
                items
            });
        }
    });
};
