import {Plugin} from "@webiny/plugins";
import {FileManagerContext, FileManagerSettingsStorageOperations} from "~/types";

interface FileManagerSettingsStorageOperationsProviderProvideParams {
    context: FileManagerContext;
}

export abstract class SettingsStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "fm.storageOperationsProvider.settings";
    
    public abstract provide(params: FileManagerSettingsStorageOperationsProviderProvideParams): Promise<FileManagerSettingsStorageOperations>;
}