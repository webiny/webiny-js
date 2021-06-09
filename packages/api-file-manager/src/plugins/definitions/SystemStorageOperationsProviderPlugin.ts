import {Plugin} from "@webiny/plugins";
import {FileManagerContext, FileManagerSystemStorageOperations} from "~/types";

interface FileManagerSystemStorageOperationsProviderProvideParams {
    context: FileManagerContext;
}

export abstract class SystemStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "fm.storageOperationsProvider.system";
    
    public abstract provide(params: FileManagerSystemStorageOperationsProviderProvideParams): Promise<FileManagerSystemStorageOperations>;
}