import { ScanCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ICommandConverter, IDynamoDbCommand } from "../../types.js";
import { NullCommandValue } from "./commands/NullCommandValue.js";

export class ScanCommandConverter implements ICommandConverter {
    public readonly name: string = "query";

    public can(input: IDynamoDbCommand): boolean {
        return input instanceof ScanCommand;
    }

    public convert() {
        return new NullCommandValue();
    }
}

export const createScanCommandConverter = (): ICommandConverter => {
    return new ScanCommandConverter();
};
