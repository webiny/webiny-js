import {
    FilesStorageOperationsProviderPlugin,
    FilesStorageOperationsProviderPluginParams
} from "@webiny/api-file-manager/plugins/definitions/FilesStorageOperationsProviderPlugin";
import { FilesStorageOperations } from "./FilesStorageOperations";
import fields from "./fields";

export class FilesStorageOperationsProviderDdb extends FilesStorageOperationsProviderPlugin {
    public override name = "fm.storageOperationsProvider.files.ddb";
    async provide({ context }: FilesStorageOperationsProviderPluginParams) {
        context.plugins.register(fields());
        return new FilesStorageOperations({
            context
        });
    }
}
