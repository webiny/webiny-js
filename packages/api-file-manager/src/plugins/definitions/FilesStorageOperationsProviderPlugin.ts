import { Plugin } from "@webiny/plugins";
import { FileManagerContext, FileManagerFilesStorageOperations } from "~/types";

export interface FilesStorageOperationsProviderPluginParams {
    context: FileManagerContext;
}

export abstract class FilesStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "fm.storageOperationsProvider.files";

    public abstract provide(
        params: FilesStorageOperationsProviderPluginParams
    ): Promise<FileManagerFilesStorageOperations>;
}
