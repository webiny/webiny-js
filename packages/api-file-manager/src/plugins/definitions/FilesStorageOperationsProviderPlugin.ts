import { Plugin } from "@webiny/plugins";
import { FileManagerContext, FileManagerFilesStorageOperations } from "~/types";

interface FileManagerFilesStorageOperationsProviderProvideParams {
    context: FileManagerContext;
}

export abstract class FilesStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "fm.storageOperationsProvider.settings";

    public abstract provide(
        params: FileManagerFilesStorageOperationsProviderProvideParams
    ): Promise<FileManagerFilesStorageOperations>;
}
