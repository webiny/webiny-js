import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class CategoryDynamoDbFieldPlugin extends FieldPlugin {
    public static readonly type: string = "pageBuilder.dynamodb.field.category";
}
