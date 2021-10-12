import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class FormDynamoDbFieldPlugin extends FieldPlugin {
    public static readonly type: string = "formBuilder.dynamodb.field.form";
}
