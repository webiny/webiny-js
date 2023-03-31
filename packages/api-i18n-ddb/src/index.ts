import { LocalesStorageOperationsProviderDdbPlugin } from "./operations/locales";
import { SystemStorageOperationsProviderDdbPlugin } from "./operations/system";

export * from "./plugins";

export const createI18NStorageOperations = () => {
    return [
        new LocalesStorageOperationsProviderDdbPlugin(),
        new SystemStorageOperationsProviderDdbPlugin()
    ];
};

export default () => {
    return createI18NStorageOperations();
};
