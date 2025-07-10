import { PutCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ICommandConverter, IDynamoDbCommand } from "../../types.js";
import { PutCommandValue } from "./commands/PutCommandValue.js";

export class PutCommandConverter implements ICommandConverter {
    public readonly name: string = "put";

    public can(input: IDynamoDbCommand): boolean {
        return input instanceof PutCommand;
    }
    public convert(input: PutCommand) {
        return new PutCommandValue(input);
    }
}

export const createPutCommandConverter = (): ICommandConverter => {
    return new PutCommandConverter();
};
