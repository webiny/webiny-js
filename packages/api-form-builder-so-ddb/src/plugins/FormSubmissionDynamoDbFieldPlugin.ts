import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class FormSubmissionDynamoDbFieldPlugin extends FieldPlugin {
    public static readonly type: string = "formBuilder.dynamodb.field.formSubmission";
}
