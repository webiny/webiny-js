import settingsOperationsProvider from "./operations/settings";
import systemOperationsProvider from "./operations/system";
import contentModelGroupStorageOperationsProvider from "./operations/modelGroup";
import contentModelStorageOperationsProvider from "./operations/model";
import contentEntryStorageOperationsProvider from "./operations/entry";
import dynamoDbPlugins from "./dynamoDb";
import { CmsContentEntryConfiguration } from "./operations/entry/CmsContentEntryDynamo";
import filterPlugins from "@webiny/db-dynamodb/plugins/filters";

interface Configuration {
    entry?: CmsContentEntryConfiguration;
}
export default (configuration?: Configuration) => {
    const { entry } = configuration || {};
    return [
        settingsOperationsProvider(),
        systemOperationsProvider(),
        contentModelGroupStorageOperationsProvider(),
        contentModelStorageOperationsProvider(),
        contentEntryStorageOperationsProvider(entry),
        dynamoDbPlugins(),
        filterPlugins()
    ];
};
