import type { DeleteCommand } from "@webiny/aws-sdk/client-dynamodb";
import type { ICommandValue, ICommandValueItemExtended } from "~/sync/types.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import { getTableType } from "~/sync/utils/getTableType.js";

export class DeleteCommandValue implements ICommandValue {
    public readonly command = "delete";
    public readonly item: ICommandValueItemExtended;

    public constructor(input: DeleteCommand) {
        const tableName = input.input.TableName as string;
        this.item = {
            command: this.command,
            PK: input.input.Key!.PK,
            SK: input.input.Key!.SK,
            tableName,
            tableType: getTableType(tableName),
            input
        };
    }

    public getItems(): NonEmptyArray<ICommandValueItemExtended> {
        return [this.item];
    }
}
