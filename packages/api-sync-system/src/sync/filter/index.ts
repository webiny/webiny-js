import {
    createFilterOutRecordPlugin,
    FilterOutRecordPlugin
} from "~/sync/plugins/FilterOutRecordPlugin.js";

/**
 * Order keys by what is most like to be filtered out - most inserts/updates/deletes.
 * This is out of my head, so it might not be the best order.
 */
const equalKeys: string[] = [
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

const startsWithKeys: string[] = [
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
                return false;
            }
        })
    ];
};
