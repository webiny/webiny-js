import { DeleteCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ICommandConverter, IDynamoDbCommand } from "../../types.js";
import { DeleteCommandValue } from "./commands/DeleteCommandValue.js";

export class DeleteCommandConverter implements ICommandConverter {
    public readonly name: string = "delete";

    public can(input: IDynamoDbCommand): boolean {
        return input instanceof DeleteCommand;
    }
    public convert(input: DeleteCommand) {
        return new DeleteCommandValue(input);
    }
}

export const createDeleteCommandConverter = (): ICommandConverter => {
    return new DeleteCommandConverter();
};
