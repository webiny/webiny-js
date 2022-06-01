import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class BlockDynamoDbFieldPlugin extends FieldPlugin {
    public static override readonly type: string = "pageBuilder.dynamodb.field.block";
}
