import { SystemStorageOperations } from "./SystemStorageOperations";
import {
    SystemStorageOperationsProviderPlugin,
    SystemStorageOperationsProviderPluginParams
} from "@webiny/api-file-manager/plugins/definitions/SystemStorageOperationsProviderPlugin";

export class SystemStorageOperationsProviderDdbPlugin extends SystemStorageOperationsProviderPlugin {
    public name = "fm.storageOperationsProvider.system.ddb";
    async provide({ context }: SystemStorageOperationsProviderPluginParams) {
        return new SystemStorageOperations({
            context
        });
    }
}
