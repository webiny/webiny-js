import { SystemStorageOperations } from "./SystemStorageOperations";
import {
    SystemStorageOperationsProviderPlugin,
    SystemStorageOperationsProviderPluginParams
} from "@webiny/api-file-manager/plugins/definitions/SystemStorageOperationsProviderPlugin";

export class SystemStorageOperationsProviderDdbPlugin extends SystemStorageOperationsProviderPlugin {
    public override name = "fm.storageOperationsProvider.system.ddb";
    public async provide({ context }: SystemStorageOperationsProviderPluginParams) {
        return new SystemStorageOperations({
            context
        });
    }
}
