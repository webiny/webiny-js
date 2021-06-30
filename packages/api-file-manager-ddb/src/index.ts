import { FilesStorageOperationsProviderDdb } from "./operations/files";
import { SettingsStorageOperationsProviderDdbPlugin } from "./operations/settings";
import { SystemStorageOperationsProviderDdbPlugin } from "./operations/system";
import filters from "@webiny/db-dynamodb/plugins/filters";

export default () => [
    new FilesStorageOperationsProviderDdb(),
    new SettingsStorageOperationsProviderDdbPlugin(),
    new SystemStorageOperationsProviderDdbPlugin(),
    filters()
];
