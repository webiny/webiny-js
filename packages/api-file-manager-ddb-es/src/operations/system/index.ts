import { FileManagerInstallationPlugin } from "./FileManagerInstallationPlugin";
import { SystemStorageOperations } from "./SystemStorageOperations";
import { SystemStorageOperationsProviderPlugin } from "@webiny/api-file-manager/plugins/definitions";

export class SystemStorageOperationsProviderDdbEsPlugin extends SystemStorageOperationsProviderPlugin {
    public name = "fm.storageOperationsProvider.system.ddb.es";
    async provide({ context }) {
        context.plugins.register(new FileManagerInstallationPlugin());

        return new SystemStorageOperations({
            context
        });
    }
}
