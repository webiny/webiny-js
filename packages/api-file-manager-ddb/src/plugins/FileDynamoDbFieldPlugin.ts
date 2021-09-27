import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class FileDynamoDbFieldPlugin extends FieldPlugin {
    public static readonly type: string = "fileManager.dynamodb.field.file";
}
