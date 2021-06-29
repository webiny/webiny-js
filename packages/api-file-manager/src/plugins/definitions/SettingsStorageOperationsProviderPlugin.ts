import { Plugin } from "@webiny/plugins";
import { FileManagerContext, FileManagerSettingsStorageOperations } from "~/types";

export interface Params {
    context: FileManagerContext;
}

export abstract class SettingsStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "fm.storageOperationsProvider.settings";

    public abstract provide(params: Params): Promise<FileManagerSettingsStorageOperations>;
}
