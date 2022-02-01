import { SystemStorageOperations } from "./SystemStorageOperations";
import {
    SystemStorageOperationsProviderPluginParams,
    SystemStorageOperationsProviderPlugin
} from "@webiny/api-i18n/plugins/SystemStorageOperationsProviderPlugin";

export class SystemStorageOperationsProviderDdbPlugin extends SystemStorageOperationsProviderPlugin {
    public name = "i18n.storageOperationsProvider.system.ddb";
    async provide({ context }: SystemStorageOperationsProviderPluginParams) {
        return new SystemStorageOperations({
            context
        });
    }
}
