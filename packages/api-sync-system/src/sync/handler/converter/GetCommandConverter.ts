import { GetCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ICommandConverter, IDynamoDbCommand } from "../../types.js";
import { NullCommandValue } from "./commands/NullCommandValue.js";

export class GetCommandConverter implements ICommandConverter {
    public readonly name: string = "get";

    public can(input: IDynamoDbCommand): boolean {
        return input instanceof GetCommand;
    }

    public convert() {
        return new NullCommandValue();
    }
}

export const createGetCommandConverter = (): ICommandConverter => {
    return new GetCommandConverter();
};
