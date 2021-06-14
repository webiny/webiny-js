import { FilesStorageOperationsProviderDdbEs } from "./operations/files";
import { SettingsStorageOperationsProviderDdbEsPlugin } from "./operations/settings";
import { SystemStorageOperationsProviderDdbEsPlugin } from "./operations/system";

export default () => [
    new FilesStorageOperationsProviderDdbEs(),
    new SettingsStorageOperationsProviderDdbEsPlugin(),
    new SystemStorageOperationsProviderDdbEsPlugin()
];
