import { SystemStorageOperations } from "./SystemStorageOperations";
import { SystemStorageOperationsProviderPlugin } from "@webiny/api-file-manager/plugins/definitions/SystemStorageOperationsProviderPlugin";

export class SystemStorageOperationsProviderDdbPlugin extends SystemStorageOperationsProviderPlugin {
    public name = "fm.storageOperationsProvider.system.ddb";
    async provide({ context }) {
        return new SystemStorageOperations({
            context
        });
    }
}
