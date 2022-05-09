import { Plugin } from "@webiny/plugins";
import { FileManagerContext, FileManagerSystemStorageOperations } from "~/types";

export interface SystemStorageOperationsProviderPluginParams<T = FileManagerContext> {
    context: T;
}

export abstract class SystemStorageOperationsProviderPlugin extends Plugin {
    public static override readonly type: string = "fm.storageOperationsProvider.system";

    public abstract provide(
        params: SystemStorageOperationsProviderPluginParams
    ): Promise<FileManagerSystemStorageOperations>;
}
