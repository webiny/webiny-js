import { FilesStorageOperationsProviderPlugin } from "@webiny/api-file-manager/plugins/definitions/FilesStorageOperationsProviderPlugin";
import { FilesStorageOperations } from "./FilesStorageOperations";
import fields from "./fields";

export class FilesStorageOperationsProviderDdbEs extends FilesStorageOperationsProviderPlugin {
    public name = "fm.storageOperationsProvider.files.ddb.es";
    async provide({ context }) {
        context.plugins.register(fields());
        return new FilesStorageOperations({
            context
        });
    }
}
