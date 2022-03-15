import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class LocaleDynamoDbFieldPlugin extends FieldPlugin {
    public static override readonly type: string = "i18n.dynamodb.field.locale";
}
