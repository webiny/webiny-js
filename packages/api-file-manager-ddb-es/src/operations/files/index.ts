import {
    FilesStorageOperationsProviderPlugin,
    FilesStorageOperationsProviderPluginParams
} from "@webiny/api-file-manager/plugins/definitions/FilesStorageOperationsProviderPlugin";
import { FilesStorageOperations } from "./FilesStorageOperations";
import fields from "./fields";

export class FilesStorageOperationsProviderDdbEs extends FilesStorageOperationsProviderPlugin {
    public name = "fm.storageOperationsProvider.files.ddb.es";
    async provide({ context }: FilesStorageOperationsProviderPluginParams) {
        context.plugins.register(fields());
        return new FilesStorageOperations({
            context
        });
    }
}
