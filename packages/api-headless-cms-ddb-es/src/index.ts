import settingsOperationsProvider from "./operations/settings";
import contentModelGroupStorageOperationsProvider from "./operations/modelGroup";
import contentModelStorageOperationsProvider from "./operations/model";
import contentEntryStorageOperationsProvider from "./operations/entry";
import upgrades from "./upgrades";
import installHook from "./hooks/install";
import elasticsearchPlugins from "./elasticsearch";
import dynamoDbPlugins from "./dynamoDb";

export default () => [
    settingsOperationsProvider(),
    contentModelGroupStorageOperationsProvider(),
    contentModelStorageOperationsProvider(),
    contentEntryStorageOperationsProvider(),
    upgrades(),
    installHook(),
    elasticsearchPlugins(),
    dynamoDbPlugins()
];
