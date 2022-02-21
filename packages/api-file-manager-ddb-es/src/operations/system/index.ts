import { FileManagerInstallationPlugin } from "./FileManagerInstallationPlugin";
import { SystemStorageOperations } from "./SystemStorageOperations";
import {
    SystemStorageOperationsProviderPlugin,
    SystemStorageOperationsProviderPluginParams
} from "@webiny/api-file-manager/plugins/definitions/SystemStorageOperationsProviderPlugin";

export class SystemStorageOperationsProviderDdbEsPlugin extends SystemStorageOperationsProviderPlugin {
    public name = "fm.storageOperationsProvider.system.ddb.es";
    async provide({ context }: SystemStorageOperationsProviderPluginParams) {
        context.plugins.register(new FileManagerInstallationPlugin());

        return new SystemStorageOperations({
            context
        });
    }
}
