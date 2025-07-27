import { BatchWriteCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ICommandConverter, IDynamoDbCommand } from "../../types.js";
import { BatchWriteCommandValue } from "./commands/BatchWriteCommandValue.js";

export class BatchWriteCommandConverter implements ICommandConverter {
    public readonly name: string = "put";

    public can(input: IDynamoDbCommand): boolean {
        return input instanceof BatchWriteCommand;
    }
    public convert(input: BatchWriteCommand) {
        return new BatchWriteCommandValue(input);
    }
}

export const createBatchWriteCommandConverter = (): ICommandConverter => {
    return new BatchWriteCommandConverter();
};
