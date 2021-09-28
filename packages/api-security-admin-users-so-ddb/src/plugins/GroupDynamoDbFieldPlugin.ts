import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class GroupDynamoDbFieldPlugin extends FieldPlugin {
    public static readonly type: string = "adminUsersSecurity.dynamodb.field.group";
}
