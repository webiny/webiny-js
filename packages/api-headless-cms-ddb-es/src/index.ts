import settingsOperationsProvider from "./operations/settings";
import systemOperationsProvider from "./operations/system";
import contentModelGroupStorageOperationsProvider from "./operations/modelGroup";
import contentModelStorageOperationsProvider from "./operations/model";
import contentEntryStorageOperationsProvider from "./operations/entry";
import upgrades from "./upgrades";
import elasticsearchPlugins from "./elasticsearch";
import dynamoDbPlugins from "./dynamoDb";

export default () => [
    settingsOperationsProvider(),
    systemOperationsProvider(),
    contentModelGroupStorageOperationsProvider(),
    contentModelStorageOperationsProvider(),
    contentEntryStorageOperationsProvider(),
    upgrades(),
    elasticsearchPlugins(),
    dynamoDbPlugins()
];
