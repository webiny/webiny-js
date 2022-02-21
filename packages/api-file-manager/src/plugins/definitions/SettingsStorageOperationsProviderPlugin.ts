import { Plugin } from "@webiny/plugins";
import { FileManagerContext, FileManagerSettingsStorageOperations } from "~/types";

export interface SettingsStorageOperationsProviderPluginParams {
    context: FileManagerContext;
}

export abstract class SettingsStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "fm.storageOperationsProvider.settings";

    public abstract provide(
        params: SettingsStorageOperationsProviderPluginParams
    ): Promise<FileManagerSettingsStorageOperations>;
}
