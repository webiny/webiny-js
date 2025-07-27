import { QueryCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ICommandConverter, IDynamoDbCommand } from "../../types.js";
import { NullCommandValue } from "./commands/NullCommandValue.js";

export class QueryCommandConverter implements ICommandConverter {
    public readonly name: string = "query";

    public can(input: IDynamoDbCommand): boolean {
        return input instanceof QueryCommand || input.constructor?.name === "QueryCommand";
    }

    public convert() {
        return new NullCommandValue();
    }
}

export const createQueryCommandConverter = (): ICommandConverter => {
    return new QueryCommandConverter();
};
