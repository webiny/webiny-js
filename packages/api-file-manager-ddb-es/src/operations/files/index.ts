import { FilesStorageOperationsProviderPlugin } from "@webiny/api-file-manager/plugins/definitions";
import { FilesStorageOperations } from "./FilesStorageOperations";

export class FilesStorageOperationsProviderDdbEs extends FilesStorageOperationsProviderPlugin {
    public name = "fm.storageOperationsProvider.files.ddb.es";
    async provide({ context }) {
        return new FilesStorageOperations({
            context
        });
    }
}
