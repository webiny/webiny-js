import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class ApwSchedulerScheduleActionDynamoDbFieldPlugin extends FieldPlugin {
    public static override readonly type: string = "apw.scheduler.dynamodb.field";
}
