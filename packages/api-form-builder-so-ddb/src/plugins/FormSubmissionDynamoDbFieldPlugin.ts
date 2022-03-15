import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class FormSubmissionDynamoDbFieldPlugin extends FieldPlugin {
    public static override readonly type: string = "formBuilder.dynamodb.field.formSubmission";
}
