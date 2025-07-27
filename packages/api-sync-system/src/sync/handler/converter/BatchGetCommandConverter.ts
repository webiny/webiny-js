import { BatchGetCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ICommandConverter, IDynamoDbCommand } from "../../types.js";
import { NullCommandValue } from "./commands/NullCommandValue.js";

export class BatchGetCommandConverter implements ICommandConverter {
    public readonly name: string = "batchGet";

    public can(input: IDynamoDbCommand): boolean {
        return input instanceof BatchGetCommand;
    }

    public convert() {
        return new NullCommandValue();
    }
}

export const createBatchGetCommandConverter = (): ICommandConverter => {
    return new BatchGetCommandConverter();
};
