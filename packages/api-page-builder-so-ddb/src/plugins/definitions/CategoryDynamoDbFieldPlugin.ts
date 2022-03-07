import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class CategoryDynamoDbFieldPlugin extends FieldPlugin {
    public static override readonly type: string = "pageBuilder.dynamodb.field.category";
}
