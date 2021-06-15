import { FilesStorageOperationsProviderDdbEs } from "./operations/files";
import { SettingsStorageOperationsProviderDdbEsPlugin } from "./operations/settings";
import { SystemStorageOperationsProviderDdbEsPlugin } from "./operations/system";
import upgrades from "./upgrades";

export default () => [
    new FilesStorageOperationsProviderDdbEs(),
    new SettingsStorageOperationsProviderDdbEsPlugin(),
    new SystemStorageOperationsProviderDdbEsPlugin(),
    upgrades()
];
