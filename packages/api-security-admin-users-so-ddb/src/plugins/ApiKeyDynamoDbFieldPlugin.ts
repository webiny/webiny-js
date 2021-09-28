import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class ApiKeyDynamoDbFieldPlugin extends FieldPlugin {
    public static readonly type: string = "adminUsersSecurity.dynamodb.field.apiKey";
}
