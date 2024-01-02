import { ApwSchedulerScheduleActionDynamoDbFieldPlugin } from "~/plugins/ApwSchedulerScheduleActionDynamoDbFieldPlugin";

const fields: ApwSchedulerScheduleActionDynamoDbFieldPlugin[] = [
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "publishedOn",
        type: "date"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "createdOn",
        type: "date"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "modifiedOn",
        type: "date"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "savedOn",
        type: "date"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "createdBy",
        path: "createdBy.id"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "modifiedBy",
        path: "modifiedBy.id"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "savedBy",
        path: "savedBy.id"
    }),

    // Deprecated. Will be removed in one of the next version.
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "ownedBy",
        path: "ownedBy.id"
    }),

    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "name"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "slug"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "locale"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "tenant"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "published",
        type: "boolean"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "status"
    }),
    new ApwSchedulerScheduleActionDynamoDbFieldPlugin({
        field: "version",
        type: "number"
    })
];
export const createFields = (): ApwSchedulerScheduleActionDynamoDbFieldPlugin[] => fields;
