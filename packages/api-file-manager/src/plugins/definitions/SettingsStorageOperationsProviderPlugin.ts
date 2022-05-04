import { Plugin } from "@webiny/plugins";
import { FileManagerContext, FileManagerSettingsStorageOperations } from "~/types";

export interface SettingsStorageOperationsProviderPluginParams<T = FileManagerContext> {
    context: T;
}

export abstract class SettingsStorageOperationsProviderPlugin extends Plugin {
    public static override readonly type: string = "fm.storageOperationsProvider.settings";

    public abstract provide(
        params: SettingsStorageOperationsProviderPluginParams
    ): Promise<FileManagerSettingsStorageOperations>;
}
