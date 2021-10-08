import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class PageDynamoDbFieldPlugin extends FieldPlugin {
    public static readonly type: string = "pageBuilder.dynamodb.page.field";
}
