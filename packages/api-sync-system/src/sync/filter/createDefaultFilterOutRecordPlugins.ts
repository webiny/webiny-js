import {
    createFilterOutRecordPlugin,
    FilterOutRecordPlugin
} from "~/sync/plugins/FilterOutRecordPlugin.js";

/**
 * Order keys by what is most like to be filtered out - most inserts/updates/deletes.
 * This is out of my head, so it might not be the best order.
 */
export const equalKeys: string[] = [
    // Logging - every request
    "LOG",
    // P
    "PS#SETTINGS",
    // Websockets - on every user login
    "WS#CONNECTIONS",
    /**
     * packages/db-dynamodb/src/DynamoDbDriver.ts
     */
    //`W#INTERNAL`,
    /**
     * APW settings
     */
    "APW#SETTINGS",
    // Deployments - on every deployment
    "DEPLOYMENTS",
    // Admin
    "ADMIN#SETTINGS"
].map(key => {
    return key.toLowerCase();
});

export const startsWithKeys: string[] = [
    // Websockets - on every user login
    "WS#",
    // Migrations - on every deployment
    "MIGRATION_RUN#",
    "MIGRATION#",
    // Service Manifest - on deployment if something was changed in the service manifest
    "SERVICE_MANIFEST#",
    // Deployments - on every deployment
    "DEPLOYMENT#"
].map(key => {
    return key.toLowerCase();
});
/**
 * TODO figure out a way to skip these models.
 * When deleting a record, we do not have a modelId in the values.
 */
export const skipModels: string[] = [
    // APW
    "apwChangeRequestModelDefinition",
    "apwCommentModelDefinition",
    "apwContentReviewModelDefinition",
    "apwReviewerModelDefinition",
    "apwWorkflowModelDefnition",
    "apwWorkflowModelDefinition",
    // AUDIT LOGS
    "acoSearchRecord-auditlogs",
    // RECORD LOCKING
    "wby_recordLocking",
    // TASKS
    "webinyTaskLog",
    "webinyTask"
].map(key => {
    return key.toLowerCase();
});

export const createDefaultFilterOutRecordPlugins = (): FilterOutRecordPlugin[] => {
    return [
        createFilterOutRecordPlugin({
            name: FilterOutRecordPlugin.createName("default"),
            filterOut: record => {
                const pk = record.PK.toLowerCase();
                if (equalKeys.includes(pk)) {
                    return true;
                }
                for (const key of startsWithKeys) {
                    if (pk.startsWith(key)) {
                        return true;
                    }
                }
                /**
                 * TODO figure out a way to skip models without using expect-error.
                 */
                // @ts-expect-error
                const modelId = record.input?.input?.Item?.modelId?.toLowerCase();
                if (!modelId) {
                    return false;
                } else if (skipModels.includes(modelId)) {
                    return true;
                }
                return false;
            }
        })
    ];
};
