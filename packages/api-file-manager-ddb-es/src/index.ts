import { attachCreateIndexOnI18NCreate } from "./attachCreateIndexOnI18NCreate";
import { FilesStorageOperationsProviderDdbEs } from "./operations/files";
import { SettingsStorageOperationsProviderDdbEsPlugin } from "./operations/settings";
import { SystemStorageOperationsProviderDdbEsPlugin } from "./operations/system";
import { elasticsearchIndexPlugins } from "~/elasticsearch/indices";

export default () => [
    elasticsearchIndexPlugins(),
    new FilesStorageOperationsProviderDdbEs(),
    new SettingsStorageOperationsProviderDdbEsPlugin(),
    new SystemStorageOperationsProviderDdbEsPlugin(),
    attachCreateIndexOnI18NCreate()
];
