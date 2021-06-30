import {
    FilesStorageOperationsProviderPlugin,
    Params
} from "@webiny/api-file-manager/plugins/definitions/FilesStorageOperationsProviderPlugin";
import { FilesStorageOperations } from "./FilesStorageOperations";
import fields from "./fields";

export class FilesStorageOperationsProviderDdb extends FilesStorageOperationsProviderPlugin {
    public name = "fm.storageOperationsProvider.files.ddb";
    async provide({ context }: Params) {
        context.plugins.register(fields());
        return new FilesStorageOperations({
            context
        });
    }
}
