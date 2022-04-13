import { attachTemplatesOnI18NCreate } from "./attachTemplatesOnI18NCreate";
import { FilesStorageOperationsProviderDdbEs } from "./operations/files";
import { SettingsStorageOperationsProviderDdbEsPlugin } from "./operations/settings";
import { SystemStorageOperationsProviderDdbEsPlugin } from "./operations/system";
import { elasticsearchIndexTemplates } from "~/elasticsearch/templates";
import upgrades from "./upgrades";

export default () => [
    elasticsearchIndexTemplates(),
    new FilesStorageOperationsProviderDdbEs(),
    new SettingsStorageOperationsProviderDdbEsPlugin(),
    new SystemStorageOperationsProviderDdbEsPlugin(),
    upgrades(),
    attachTemplatesOnI18NCreate()
];
