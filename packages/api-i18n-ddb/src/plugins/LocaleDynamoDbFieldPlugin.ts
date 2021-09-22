import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class LocaleDynamoDbFieldPlugin extends FieldPlugin {
    public static readonly type: string = "i18n.dynamodb.field.locale";
}
