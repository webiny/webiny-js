import { attachCreateIndexOnI18NCreate } from "./attachCreateIndexOnI18NCreate";
import { FilesStorageOperationsProviderDdbEs } from "./operations/files";
import { SettingsStorageOperationsProviderDdbEsPlugin } from "./operations/settings";
import { SystemStorageOperationsProviderDdbEsPlugin } from "./operations/system";
import { elasticsearchIndexPlugins } from "~/elasticsearch/indices";
import upgrades from "./upgrades";

export default () => [
    elasticsearchIndexPlugins(),
    new FilesStorageOperationsProviderDdbEs(),
    new SettingsStorageOperationsProviderDdbEsPlugin(),
    new SystemStorageOperationsProviderDdbEsPlugin(),
    upgrades(),
    attachCreateIndexOnI18NCreate()
];
