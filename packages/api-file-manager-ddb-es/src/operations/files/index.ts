import {
    FilesStorageOperationsProviderPlugin,
    FilesStorageOperationsProviderPluginParams
} from "@webiny/api-file-manager/plugins/definitions/FilesStorageOperationsProviderPlugin";
import { FilesStorageOperations } from "./FilesStorageOperations";
import fields from "./fields";
import { FileManagerContext } from "~/types";

export class FilesStorageOperationsProviderDdbEs extends FilesStorageOperationsProviderPlugin {
    public override name = "fm.storageOperationsProvider.files.ddb.es";
    public async provide({
        context
    }: FilesStorageOperationsProviderPluginParams<FileManagerContext>) {
        context.plugins.register(fields());
        return new FilesStorageOperations({
            context
        });
    }
}
