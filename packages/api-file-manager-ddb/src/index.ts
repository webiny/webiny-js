import { FilesStorageOperationsProviderDdb } from "./operations/files";
import { SettingsStorageOperationsProviderDdbPlugin } from "./operations/settings";
import { SystemStorageOperationsProviderDdbPlugin } from "./operations/system";

export default () => [
    new FilesStorageOperationsProviderDdb(),
    new SettingsStorageOperationsProviderDdbPlugin(),
    new SystemStorageOperationsProviderDdbPlugin()
];
