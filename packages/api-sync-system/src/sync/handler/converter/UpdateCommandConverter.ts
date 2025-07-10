import { UpdateCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ICommandConverter, IDynamoDbCommand } from "../../types.js";
import { UpdateCommandValue } from "./commands/UpdateCommandValue.js";

export class UpdateCommandConverter implements ICommandConverter {
    public readonly name: string = "update";

    public can(input: IDynamoDbCommand): boolean {
        return input instanceof UpdateCommand;
    }
    public convert(input: UpdateCommand) {
        return new UpdateCommandValue(input);
    }
}

export const createUpdateCommandConverter = (): ICommandConverter => {
    return new UpdateCommandConverter();
};
