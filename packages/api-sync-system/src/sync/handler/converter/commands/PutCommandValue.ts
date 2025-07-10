import type { PutCommand } from "@webiny/aws-sdk/client-dynamodb";
import type { ICommandValue, ICommandValueItemExtended } from "~/sync/types.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import { getTableType } from "~/sync/utils/getTableType.js";

export class PutCommandValue implements ICommandValue {
    public readonly command = "put";
    public readonly item: ICommandValueItemExtended;

    public constructor(input: PutCommand) {
        const tableName = input.input.TableName as string;
        this.item = {
            command: this.command,
            PK: input.input.Item!.PK,
            SK: input.input.Item!.SK,
            tableName,
            tableType: getTableType(tableName),
            input
        };
    }

    public getItems(): NonEmptyArray<ICommandValueItemExtended> {
        return [this.item];
    }
}
