import { FileManagerInstallationPlugin } from "./FileManagerInstallationPlugin";
import { SystemStorageOperations } from "./SystemStorageOperations";
import {
    SystemStorageOperationsProviderPlugin,
    SystemStorageOperationsProviderPluginParams
} from "@webiny/api-file-manager/plugins/definitions/SystemStorageOperationsProviderPlugin";
import { base as baseFileElasticsearchIndexTemplate } from "~/elasticsearch/templates/base";

export class SystemStorageOperationsProviderDdbEsPlugin extends SystemStorageOperationsProviderPlugin {
    public override name = "fm.storageOperationsProvider.system.ddb.es";
    public async provide({ context }: SystemStorageOperationsProviderPluginParams) {
        context.plugins.register([
            new FileManagerInstallationPlugin(),
            baseFileElasticsearchIndexTemplate
        ]);

        return new SystemStorageOperations({
            context
        });
    }
}
