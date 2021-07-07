import { LocalesStorageOperationsProviderDdbPlugin } from "./operations/locales";
import { SystemStorageOperationsProviderDdbPlugin } from "./operations/system";

export default () => [
    new LocalesStorageOperationsProviderDdbPlugin(),
    new SystemStorageOperationsProviderDdbPlugin()
];
